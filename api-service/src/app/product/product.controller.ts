import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ProductOwnershipGuard } from './guards/product-ownership.guard';
import { ResourceStatusGuard } from '../common/guards/resource-status.guard';
import { CheckStatus } from '../common/decorators/check-status.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MerchantOwnershipPipe } from '../common/pipes/merchant-ownership.pipe';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard, ResourceStatusGuard)
  @CheckStatus(RESOURCE_TARGETS.MERCHANT)
  @Permissions('product:create')
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body(MerchantOwnershipPipe) createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    return this.productService.create(createProductDto, files);
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('merchantId') merchantId?: string
  ) {
    return this.productService.findAll(paginationDto, merchantId);
  }

  // Public listing for B2C storefront (paginated, active products only)
  @Get('public')
  findPublic(@Query() paginationDto: PaginationDto) {
    return this.productService.findPublic(paginationDto);
  }

  @Get('merchant/me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:read')
  findMyMerchantProducts(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto
  ) {
    return this.productService.findAllByCurrentMerchant(
      req.user.userId,
      paginationDto
    );
  }

  @Get('merchant/:merchantId')
  findAllByMerchant(
    @Param('merchantId') merchantId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.productService.findAllByMerchant(merchantId, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') externalId: string) {
    return this.productService.findOne(externalId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProductOwnershipGuard)
  @Permissions('product:update')
  update(
    @Param('id') externalId: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productService.update(externalId, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProductOwnershipGuard)
  @Permissions('product:delete')
  remove(@Param('id') externalId: string) {
    return this.productService.remove(externalId);
  }
}
