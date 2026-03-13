import {
  PipeTransform,
  Injectable,
  Inject,
  Scope,
  ForbiddenException,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { ROLE } from '../constants/role.constants';
import {
  PRODUCT_MESSAGES,
  COMMON_MESSAGES,
} from '../constants/messages.constant';

@Injectable({ scope: Scope.REQUEST })
export class MerchantOwnershipPipe implements PipeTransform {
  constructor(
    @Inject(REQUEST) private request: any,
    private prisma: PrismaService
  ) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    value = value || {};

    const user = this.request.user;

    if (!user) {
      throw new ForbiddenException(COMMON_MESSAGES.USER_NOT_FOUND_IN_CONTEXT);
    }

    const inputId = value.merchantId ?? this.request.query?.merchantId;
    const isMerchantOwner =
      Array.isArray(user.roles) && user.roles.includes(ROLE.MERCHANT_OWNER);

    // Merchant owner requests are always scoped to the merchant bound to the authenticated user.
    if (isMerchantOwner) {
      const boundMerchantId = await this.resolveMerchantIdByUser(user.userId);

      if (!boundMerchantId) {
        throw new ForbiddenException(
          PRODUCT_MESSAGES.PERMISSION_DENIED_CREATION
        );
      }

      value.merchantId = boundMerchantId;
      return value;
    }

    if (!inputId) {
      throw new BadRequestException(COMMON_MESSAGES.MERCHANT_ID_REQUIRED);
    }

    const internalMerchantId = await this.parseMerchantId(inputId);

    const hasPermission = await this.validatePermission(
      user.userId,
      internalMerchantId
    );

    if (!hasPermission) {
      throw new ForbiddenException(PRODUCT_MESSAGES.PERMISSION_DENIED_CREATION);
    }

    // Inject internal ID back to value so Service can use it
    value.merchantId = internalMerchantId;

    return value;
  }

  private async validatePermission(
    userId: number,
    merchantId: number
  ): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        merchantId,
        role: { name: ROLE.MERCHANT_OWNER },
      },
    });

    if (userRole) return true;

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { agency: true },
    });

    if (merchant?.agency?.ownerId === userId) {
      return true;
    }

    return false;
  }

  private async parseMerchantId(inputId: string | number): Promise<number> {
    if (typeof inputId === 'string' && inputId.length > 20) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { externalId: inputId },
      });
      if (!merchant) {
        throw new BadRequestException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
      }
      return merchant.id;
    }

    const internalMerchantId = Number(inputId);
    if (isNaN(internalMerchantId)) {
      throw new BadRequestException(COMMON_MESSAGES.INVALID_MERCHANT_ID_FORMAT);
    }

    return internalMerchantId;
  }

  private async resolveMerchantIdByUser(
    userId: number
  ): Promise<number | null> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        merchantId: { not: null },
        role: { name: ROLE.MERCHANT_OWNER },
      },
      select: { merchantId: true },
      orderBy: { createdAt: 'desc' },
    });

    if (userRole?.merchantId) {
      return userRole.merchantId;
    }

    const merchant = await this.prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    return merchant?.id ?? null;
  }
}
