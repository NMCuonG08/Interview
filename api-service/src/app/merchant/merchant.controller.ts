import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { AdminCreateMerchantDto } from './dto/admin-create-merchant.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateMerchantStatusDto } from './dto/update-merchant-status.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MerchantQueryDto } from './dto/merchant-query.dto';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';

@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.merchantService.requestOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.merchantService.verifyOtp(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  findAll(@Query() query: MerchantQueryDto) {
    return this.merchantService.findAll(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: AuthenticatedRequest) {
    return this.merchantService.findMine(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('merchant:read')
  findOne(@Param('id') externalId: string) {
    return this.merchantService.findByExternalId(externalId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('merchant:update_status')
  updateStatus(
    @Param('id') externalId: string,
    @Body() dto: UpdateMerchantStatusDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.merchantService.updateStatus(externalId, dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  create(@Request() req, @Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(req.user.userId, createMerchantDto);
  }

  @Post('admin-create')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  adminCreate(@Request() req, @Body() dto: AdminCreateMerchantDto) {
    return this.merchantService.adminCreate(req.user.userId, dto);
  }
}
