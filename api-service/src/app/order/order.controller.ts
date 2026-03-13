import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MerchantOrderQueryDto } from './dto/merchant-order-query.dto';
import { UpdateMerchantOrderStatusDto } from './dto/update-merchant-order-status.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:create')
  create(@Request() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.userId;
    return this.orderService.create(userId, dto);
  }

  @Get('merchant/me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:read')
  findMerchantOrders(
    @Request() req: any,
    @Query() query: MerchantOrderQueryDto
  ) {
    const userId = req.user?.userId;
    return this.orderService.findMerchantOrders(userId, query);
  }

  @Patch(':externalId/merchant-status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:update_status')
  updateMerchantOrderStatus(
    @Request() req: any,
    @Param('externalId') externalId: string,
    @Body() dto: UpdateMerchantOrderStatusDto
  ) {
    const userId = req.user?.userId;
    return this.orderService.updateMerchantOrderStatus(userId, externalId, dto);
  }
}
