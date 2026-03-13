import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
import {
  PRODUCT_MESSAGES,
  COMMON_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { StorageService } from '../common/services/storage.service';
import { toLocalizedJson } from '../common/utils/localization.util';
import { PRODUCT_CONSTANTS } from '../common/constants/product.constant';
import { PRIMITIVE_TYPES } from '../common/constants/common.constant';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { ROLE } from '../common/constants/role.constants';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  private serializePrice(
    price: Prisma.Decimal | number | string | null | undefined
  ): number | null {
    if (price == null) {
      return null;
    }

    return typeof price === 'number' ? price : Number(price);
  }

  private serializeProduct<
    T extends { price?: Prisma.Decimal | number | string | null }
  >(product: T): Omit<T, 'price'> & { price: number | null } {
    return {
      ...product,
      price: this.serializePrice(product.price),
    };
  }

  async create(
    createProductDto: CreateProductDto,
    files?: Array<Express.Multer.File>
  ) {
    const { name, description, metadata, merchantId, categoryId, ...rest } =
      createProductDto;

    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await this.storageService.uploadFile(
          file,
          PRODUCT_CONSTANTS.STORAGE_FOLDER
        );
        imageUrls.push(url);
      }
    }

    const nameJson = toLocalizedJson(name);
    const descJson = description
      ? toLocalizedJson(description)
      : Prisma.JsonNull;

    const metaObj = metadata
      ? typeof metadata === PRIMITIVE_TYPES.STRING
        ? JSON.parse(metadata as unknown as string)
        : metadata
      : {};

    if (imageUrls.length > 0) {
      metaObj[PRODUCT_CONSTANTS.METADATA.IMAGES] = imageUrls;
      if (!metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL]) {
        metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL] = imageUrls[0];
      }
    }

    metaObj.categoryId = categoryId;

    const metaJson = metaObj as unknown as Prisma.InputJsonValue;

    const product = await this.prisma.product.create({
      data: {
        ...rest,
        merchantId: merchantId as unknown as number,
        name: nameJson,
        description: descJson,
        metadata: metaJson,
      },
    });

    return this.serializeProduct(product);
  }

  async findAll(
    paginationDto: PaginationDto,
    merchantExternalId?: string
  ): Promise<PaginatedResult<any>> {
    let merchantId: number | undefined;

    if (merchantExternalId) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { externalId: merchantExternalId },
        select: { id: true },
      });

      if (!merchant) {
        throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
      }

      merchantId = merchant.id;
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where = merchantId ? { merchantId } : {};

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          merchant: {
            select: { externalId: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = rows.map((product) => ({
      ...this.serializeProduct(product),
      merchantExternalId: product.merchant.externalId,
    }));

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async findPublic(
    paginationDto: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          merchant: {
            select: { externalId: true },
          },
        },
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    const data = rows.map((p) => ({
      externalId: p.externalId,
      name: p.name,
      description: p.description,
      price: this.serializePrice(p.price),
      currency: p.currency,
      sku: p.sku,
      stock: p.stock,
      isActive: p.isActive,
      metadata: p.metadata,
      merchantId: p.merchantId,
      merchantExternalId: p.merchant.externalId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async findAllByMerchant(
    merchantExternalId: string,
    paginationDto: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: merchantExternalId },
    });

    if (!merchant) {
      throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
    }

    return this.findAllByMerchantId(merchant.id, paginationDto);
  }

  async findAllByCurrentMerchant(
    userId: number,
    paginationDto: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const merchantRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        merchantId: { not: null },
        role: { name: ROLE.MERCHANT_OWNER },
      },
      select: { merchantId: true },
      orderBy: { createdAt: 'desc' },
    });

    if (merchantRole?.merchantId) {
      return this.findAllByMerchantId(merchantRole.merchantId, paginationDto);
    }

    const ownedMerchant = await this.prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!ownedMerchant) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.MERCHANT)
      );
    }

    return this.findAllByMerchantId(ownedMerchant.id, paginationDto);
  }

  private async findAllByMerchantId(
    merchantId: number,
    paginationDto: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { merchantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {},
      }),
      this.prisma.product.count({
        where: { merchantId },
      }),
    ]);

    return {
      data: rows.map((row) => this.serializeProduct(row)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async findOne(externalId: string) {
    const product = await this.prisma.product.findUnique({
      where: { externalId },
      include: {
        merchant: true,
      },
    });
    if (!product) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return {
      ...this.serializeProduct(product),
      merchantExternalId: product.merchant.externalId,
    };
  }

  async update(externalId: string, updateProductDto: UpdateProductDto) {
    await this.findOne(externalId);

    const { name, description, metadata, categoryId, ...rest } =
      updateProductDto;

    const data: Prisma.ProductUpdateInput = {
      ...rest,
    };

    if (name) {
      data.name = name as unknown as Prisma.InputJsonValue;
    }
    if (description) {
      data.description = description as unknown as Prisma.InputJsonValue;
    }
    if (metadata || categoryId !== undefined) {
      const currentProduct = await this.prisma.product.findUnique({
        where: { externalId },
        select: { metadata: true },
      });

      const currentMetadata =
        currentProduct?.metadata &&
        typeof currentProduct.metadata === PRIMITIVE_TYPES.OBJECT &&
        !Array.isArray(currentProduct.metadata)
          ? (currentProduct.metadata as Record<string, unknown>)
          : {};

      const incomingMetadata = metadata
        ? typeof metadata === PRIMITIVE_TYPES.STRING
          ? (JSON.parse(metadata as unknown as string) as Record<
              string,
              unknown
            >)
          : (metadata as unknown as Record<string, unknown>)
        : {};

      const mergedMetadata: Record<string, unknown> = {
        ...currentMetadata,
        ...incomingMetadata,
      };

      if (categoryId !== undefined) {
        mergedMetadata.categoryId = categoryId;
      }

      data.metadata = mergedMetadata as Prisma.InputJsonValue;
    }

    const product = await this.prisma.product.update({
      where: { externalId },
      data,
    });

    return this.serializeProduct(product);
  }

  async remove(externalId: string) {
    await this.findOne(externalId);
    return this.prisma.product.delete({
      where: { externalId },
    });
  }
}
