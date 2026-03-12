import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CourierService } from './courier.service';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CourierQueryDto } from './dto/courier-query.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import { RejectCourierDto } from './dto/reject-courier.dto';

@Controller('couriers')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  // ========= OTP Registration =========

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.courierService.requestOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.courierService.verifyOtp(dto);
  }

  // ========= Registration (self-service) =========

  @UseGuards(JwtAuthGuard)
  @Post('register')
  register(@Request() req, @Body() dto: CreateCourierDto) {
    return this.courierService.create(req.user.userId, dto);
  }

  // ========= Management (Admin) =========

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findAll(@Query() query: CourierQueryDto) {
    return this.courierService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findOne(@Param('id') externalId: string) {
    return this.courierService.findByExternalId(externalId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:delete')
  @Delete(':id')
  async remove(@Param('id') externalId: string) {
    await this.courierService.softDelete(externalId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:approve')
  @Post(':id/approve')
  approve(@Request() req, @Param('id') externalId: string) {
    return this.courierService.approve(externalId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:reject')
  @Post(':id/reject')
  reject(
    @Request() req,
    @Param('id') externalId: string,
    @Body() dto: RejectCourierDto
  ) {
    return this.courierService.reject(externalId, dto, req.user.userId);
  }
}
