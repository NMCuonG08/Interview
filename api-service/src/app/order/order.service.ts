import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma, ApprovalStatus } from '@prisma/client';
import { COURIER_AVAILABILITY_STATUS } from '../common/constants/courier.constant';
import { MerchantOrderQueryDto } from './dto/merchant-order-query.dto';
import { UpdateMerchantOrderStatusDto } from './dto/update-merchant-order-status.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto) {
    if (!userId) {
      throw new BadRequestException('Invalid user context');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: dto.merchantExternalId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const productExternalIds = dto.items.map((i) => i.productExternalId);
    const products = await this.prisma.product.findMany({
      where: {
        externalId: { in: productExternalIds },
        merchantId: merchant.id,
        isActive: true,
      },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Some products are invalid or inactive');
    }

    // Basic total amount calculation
    let totalAmount = 0;
    for (const item of dto.items) {
      const product = products.find(
        (p) => p.externalId === item.productExternalId
      );
      if (!product || !product.price) continue;
      totalAmount += Number(product.price) * item.quantity;
    }

    const deliveryAddress: Prisma.InputJsonValue | undefined =
      dto.deliveryLocation || dto.deliveryAddressNote
        ? {
            location: dto.deliveryLocation
              ? {
                  latitude: dto.deliveryLocation.latitude,
                  longitude: dto.deliveryLocation.longitude,
                }
              : null,
            note: dto.deliveryAddressNote || null,
          }
        : undefined;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          merchantId: merchant.id,
          totalAmount,
          status: 'pending',
          paymentStatus: 'pending',
          courierId: null,
          deliveryAddress,
        },
      });

      await tx.orderItem.createMany({
        data: dto.items.map((item) => {
          const product = products.find(
            (p) => p.externalId === item.productExternalId
          );
          const price = product?.price ? Number(product.price) : 0;

          return {
            orderId: order.id,
            productId: product!.id,
            quantity: item.quantity,
            price,
            total: price * item.quantity,
          };
        }),
      });

      return order;
    });
  }

  async findMerchantOrders(userId: number, query: MerchantOrderQueryDto) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true, externalId: true, name: true },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found for current user');
    }

    const take = query.limit ?? 10;
    const where: Prisma.OrderWhereInput = {
      merchantId: merchant.id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: query.skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              username: true,
            },
          },
          courier: {
            select: {
              externalId: true,
            },
          },
          orderItems: {
            select: {
              quantity: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => ({
        externalId: order.externalId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
        customerEmail: order.user.email,
        customerName: order.user.username,
        courierExternalId: order.courier?.externalId ?? null,
        itemCount: order.orderItems.reduce(
          (sum, item) => sum + (item.quantity ?? 0),
          0
        ),
        createdAt: order.createdAt,
      })),
      total,
      page: query.page ?? 1,
      limit: take,
      merchant: {
        externalId: merchant.externalId,
        name: merchant.name,
      },
    };
  }

  async updateMerchantOrderStatus(
    userId: number,
    orderExternalId: string,
    dto: UpdateMerchantOrderStatusDto
  ) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found for current user');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        externalId: orderExternalId,
        merchantId: merchant.id,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const action = dto.action.toLowerCase();

    if (action === 'accept') {
      if (order.status !== 'pending') {
        throw new BadRequestException(
          `Only pending orders can be accepted. Current status: ${order.status}`
        );
      }

      const courier = await this.findEligibleCourier();
      if (!courier) {
        throw new BadRequestException(
          'No eligible courier available right now'
        );
      }

      return this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'confirmed',
          courierId: courier.id,
        },
      });
    }

    if (action === 'reject') {
      if (order.status !== 'pending') {
        throw new BadRequestException(
          `Only pending orders can be rejected. Current status: ${order.status}`
        );
      }

      return this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'cancelled',
          courierId: null,
        },
      });
    }

    throw new BadRequestException('Unsupported action');
  }

  private async findEligibleCourier() {
    // Prefer approved couriers who are online/available.
    const preferredCouriers = await this.prisma.courier.findMany({
      where: {
        approvalStatus: ApprovalStatus.APPROVED,
        status: {
          in: [
            COURIER_AVAILABILITY_STATUS.AVAILABLE,
            COURIER_AVAILABILITY_STATUS.ONLINE,
            'AVAILABLE',
            'ONLINE',
          ],
        },
        deletedAt: null,
      },
      orderBy: { id: 'asc' },
      take: 1,
    });

    if (preferredCouriers[0]) {
      return preferredCouriers[0];
    }

    // Backward compatibility: old approved couriers may have null status.
    const fallbackCourier = await this.prisma.courier.findFirst({
      where: {
        approvalStatus: ApprovalStatus.APPROVED,
        status: null,
        deletedAt: null,
      },
      orderBy: { id: 'asc' },
    });

    if (!fallbackCourier) {
      return null;
    }

    return this.prisma.courier.update({
      where: { id: fallbackCourier.id },
      data: { status: COURIER_AVAILABILITY_STATUS.AVAILABLE },
    });
  }
}
