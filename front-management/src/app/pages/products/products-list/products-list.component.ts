import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AuthService,
  ProductListResponse,
  ProductService as SharedProductService,
  ProductResponse,
  MerchantService as SharedMerchantService,
  MerchantApiResponse,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import {
  DataTableComponent,
  TableCellDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TableConfig,
  TableHeaderConfig,
  TablePagination,
  TablePageEvent,
} from '../../../shared/interfaces/table.interface';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select.component';

type ProductRow = Record<string, unknown> & {
  id: string;
  name: string;
  price: string;
  sku: string;
  stock: string;
  isActive: boolean;
  createdAt: string | Date;
};

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    CustomSelectComponent,
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly productService = inject(SharedProductService);
  private readonly merchantService = inject(SharedMerchantService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);
  readonly router = inject(Router);

  readonly canManageAllMerchants = computed(() =>
    this.authService.hasPermission('system:manage_users')
  );

  readonly merchants = signal<MerchantApiResponse[]>([]);
  readonly selectedMerchantId = signal<string | null>(null);

  readonly products = signal<ProductRow[]>([]);
  readonly isLoading = signal(false);

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  readonly merchantOptions = computed(() =>
    this.merchants().map((m) => ({
      value: m.externalId,
      label: m.name,
    }))
  );

  readonly tableConfig: TableConfig<Record<string, unknown>> = {
    id: 'products-table',
    rowIdKey: 'id',
    hoverable: true,
    columns: [
      {
        key: 'name',
        labelKey: 'admin.products.table.name',
        type: 'text',
      },
      {
        key: 'price',
        labelKey: 'admin.products.table.price',
        type: 'text',
      },
      {
        key: 'sku',
        labelKey: 'admin.products.table.sku',
        type: 'text',
      },
      {
        key: 'stock',
        labelKey: 'admin.products.table.stock',
        type: 'text',
      },
      {
        key: 'isActive',
        labelKey: 'admin.products.table.status',
        type: 'status',
        statusConfig: {
          true: { labelKey: 'common.status.active', variant: 'success' },
          false: { labelKey: 'common.status.inactive', variant: 'default' },
        } as Record<
          string,
          { labelKey: string; variant: 'success' | 'default' }
        >,
      },
    ],
    actions: [
      {
        id: 'edit',
        labelKey: 'common.button.edit',
        icon: 'edit',
        variant: 'default',
      },
      {
        id: 'delete',
        labelKey: 'common.button.delete',
        icon: 'delete',
        variant: 'danger',
      },
    ],
  };

  readonly tableHeaderConfig: TableHeaderConfig = {
    show: true,
    title: {
      labelKey: 'admin.products.title',
      showCount: true,
    },
    search: {
      enabled: false,
      placeholderKey: '',
      minWidth: '0',
    },
    actions: [
      {
        id: 'add',
        labelKey: 'admin.products.addNew',
        icon: 'assets/icons/icon-plus.svg',
        variant: 'primary',
        showOnMobile: true,
        showOnDesktop: true,
      },
    ],
  };

  readonly tableData = computed(
    () => this.products() as unknown as Record<string, unknown>[]
  );

  ngOnInit(): void {
    this.loadMerchants();
  }

  private loadMerchants(): void {
    if (!this.canManageAllMerchants()) {
      this.loadOwnedMerchant();
      return;
    }

    this.merchantService
      .findAll({
        page: 1,
        limit: 100,
        approvalStatus: 'APPROVED',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.merchants.set(response.data);
          if (response.data.length > 0) {
            this.selectedMerchantId.set(response.data[0].externalId);
            this.loadProducts();
          }
        },
        error: (error) => {
          console.error('Failed to load merchants:', error);
          this.loadOwnedMerchant();
        },
      });
  }

  private loadOwnedMerchant(): void {
    this.merchantService
      .findMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (merchant) => {
          this.merchants.set([merchant]);
          this.selectedMerchantId.set(merchant.externalId);
          this.loadProducts();
        },
        error: (error) => {
          console.error('Failed to load owned merchant:', error);
          this.merchants.set([]);
          this.selectedMerchantId.set(null);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate('admin.products.merchantRequired')
          );
        },
      });
  }

  onMerchantChange(merchantId: string | null): void {
    if (!merchantId) return;
    this.selectedMerchantId.set(merchantId);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadProducts();
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({
      ...prev,
      page: event.page,
    }));
    this.loadProducts();
  }

  onAction(event: { actionId: string; row: Record<string, unknown> }): void {
    const row = event.row as ProductRow;
    if (event.actionId === 'edit') {
      this.router.navigate(['/products/edit', row.id]);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(row);
    }
  }

  onHeaderAction(actionId: string): void {
    if (actionId === 'add') {
      const merchantId = this.selectedMerchantId();
      const queryParams =
        this.canManageAllMerchants() && merchantId ? { merchantId } : undefined;

      this.router.navigate(['/products/create'], {
        queryParams,
      });
    }
  }

  private confirmDelete(row: ProductRow): void {
    this.modalService.showConfirmation(
      this.translationService.translate('common.button.delete'),
      this.translationService.translate('admin.products.deleteConfirm'),
      () => this.deleteProduct(row.id)
    );
  }

  private deleteProduct(externalId: string): void {
    this.productService
      .delete(externalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate('admin.products.deleteSuccess')
          );
          this.loadProducts();
        },
        error: (error) => {
          console.error('Failed to delete product:', error);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate('admin.products.deleteError')
          );
        },
      });
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();
    let productRequest$: Observable<ProductListResponse> | null = null;

    if (this.canManageAllMerchants()) {
      const merchantId = this.selectedMerchantId();
      if (!merchantId) {
        this.isLoading.set(false);
        return;
      }
      productRequest$ = this.productService.findAllByMerchant(merchantId, {
        page,
        limit: pageSize,
      });
    } else {
      productRequest$ = this.productService.findMine({
        page,
        limit: pageSize,
      });
    }

    productRequest$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const rows: ProductRow[] = response.data.map((p) => ({
          id: p.externalId,
          name: this.resolveName(p),
          price: this.formatPrice(p),
          sku: p.sku ?? '',
          stock: p.stock != null ? String(p.stock) : '',
          isActive: p.isActive ?? true,
          createdAt: p.createdAt,
        }));

        this.products.set(rows);
        const total =
          typeof response.total === 'number'
            ? response.total
            : response.meta?.total ?? rows.length;
        this.pagination.update((prev) => ({
          ...prev,
          total,
        }));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.isLoading.set(false);
        this.modalService.showError(
          this.translationService.translate('common.status.error'),
          this.translationService.translate('admin.products.loadError')
        );
      },
    });
  }

  private resolveName(product: ProductResponse): string {
    if (!product.name) return '';
    if (typeof product.name === 'string') return product.name;
    try {
      const localizedName = product.name as Record<string, string | undefined>;
      return (
        localizedName['vi'] || localizedName['en'] || localizedName['ko'] || ''
      );
    } catch {
      return '';
    }
  }

  private formatPrice(product: ProductResponse): string {
    const priceNumber =
      typeof product.price === 'string'
        ? Number(product.price)
        : (product.price as number | undefined);
    if (!priceNumber && priceNumber !== 0) return '';
    return `${priceNumber.toLocaleString('vi-VN')} ${
      product.currency ?? 'VND'
    }`;
  }
}
