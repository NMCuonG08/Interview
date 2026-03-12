import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '../otp/otp.service';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { CourierListResponse, CourierQueryDto } from './dto/courier-query.dto';
import { CourierEntity } from './entities';
import { CourierQueryBuilder } from './builders/courier-query.builder';
import { COURIER_REGISTRATION_OTP } from '../common/constants/courier.constant';
import {
  AUTH_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { RejectCourierDto } from './dto/reject-courier.dto';

@Injectable()
export class CourierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService
  ) {}

  // ============= OTP Registration Flow ============

  async requestOtp(dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto, COURIER_REGISTRATION_OTP);
  }

  // ============= Query / CRUD =============

  async findAll(
    query: CourierQueryDto
  ): Promise<CourierListResponse<CourierEntity>> {
    const take = query.limit ?? 10;
    const skip = query.skip;

    const where = new CourierQueryBuilder()
      .withNotDeleted()
      .withApprovalStatus(query.approvalStatus)
      .withSearch(query.search)
      .withDateRange(query.startDate, query.endDate)
      .build();

    const [items, total] = await this.prisma.$transaction([
      this.prisma.courier.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.courier.count({ where }),
    ]);

    return {
      data: items.map((item) => new CourierEntity(item)),
      total,
      page: query.page ?? 1,
      limit: take,
    };
  }

  async findByExternalId(externalId: string): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    return new CourierEntity(courier);
  }

  async update(
    externalId: string,
    dto: UpdateCourierDto
  ): Promise<CourierEntity> {
    const existing = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    const updated = await this.prisma.courier.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.vehicleType !== undefined && { vehicleType: dto.vehicleType }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return new CourierEntity(updated);
  }

  async create(userId: number, dto: CreateCourierDto): Promise<CourierEntity> {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch {
      throw new UnauthorizedException(
        AUTH_MESSAGES.INVALID_OR_EXPIRED_VERIFICATION_TOKEN
      );
    }

    if (payload.type !== COURIER_REGISTRATION_OTP) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN_TYPE);
    }

    if (payload.phone !== dto.phone) {
      throw new UnauthorizedException(AUTH_MESSAGES.PHONE_NUMBER_MISMATCH);
    }

    const courier = await this.prisma.courier.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        vehicleType: dto.vehicleType,
        // approvalStatus default PENDING từ Prisma schema
      },
    });

    return new CourierEntity(courier);
  }

  async softDelete(externalId: string): Promise<void> {
    const existing = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    await this.prisma.courier.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
  }

  async approve(
    externalId: string,
    actorUserId: number
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
    });
    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    // Idempotent: already approved -> return current state, no audit
    if (courier.approvalStatus === 'APPROVED') {
      return new CourierEntity(courier);
    }

    const updated = await this.prisma.courier.update({
      where: { id: courier.id },
      data: {
        approvalStatus: 'APPROVED',
        rejectionReason: null,
      },
    });

    await this.prisma.courierApprovalAudit.create({
      data: {
        courierId: courier.id,
        actorUserId,
        action: 'APPROVE',
      },
    });

    return new CourierEntity(updated);
  }

  async reject(
    externalId: string,
    dto: RejectCourierDto,
    actorUserId: number
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
    });
    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    // Idempotent: already rejected -> return current state, no audit
    if (courier.approvalStatus === 'REJECTED') {
      return new CourierEntity(courier);
    }

    if (courier.approvalStatus === 'APPROVED') {
      throw new BadRequestException('Courier is already approved');
    }

    const updated = await this.prisma.courier.update({
      where: { id: courier.id },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: dto.rejectionReason,
      },
    });

    await this.prisma.courierApprovalAudit.create({
      data: {
        courierId: courier.id,
        actorUserId,
        action: 'REJECT',
        reason: dto.rejectionReason,
      },
    });

    return new CourierEntity(updated);
  }
}
