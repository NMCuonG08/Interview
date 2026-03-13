import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TranslatePipe,
  MerchantService as SharedMerchantService,
  TranslationService,
  CategoryService,
  LocalizedString,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DataTableComponent,
  TableCellDirective,
  MobileCardDirective,
  ActionMenuDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TablePagination,
  TablePageEvent,
  TableSortEvent,
  TableHeaderActionEvent,
  TableHeaderSearchEvent,
  TableHeaderFilterEvent,
} from '../../../shared/interfaces/table.interface';
import {
  Merchant,
  MerchantApiResponse,
  generateMerchantInitials,
  generateMerchantInitialsColor,
  mapMerchantOperationalStatus,
  mapMerchantApprovalStatus,
  mapBusinessCategory,
  mapBusinessType,
  mapTagName,
} from '../../../shared/interfaces/merchant.interface';
import { StatisticCardComponent } from '../../../shared/components/statistic-card';
import {
  MERCHANTS_TABLE_CONFIG,
  MERCHANTS_TABLE_HEADER_CONFIG,
  MerchantStatistics,
  createMerchantStatisticCards,
} from './merchants.config';
import {
  SlideOverPanelComponent,
  SlideOverConfig,
} from '../../../shared/components/slide-over-panel/slide-over-panel.component';
import { AddMerchantFormComponent } from './components/add-merchant-form/add-merchant-form.component';
import { AdminCreateMerchantRequest } from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

@Component({
  selector: 'app-merchants',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    TableCellDirective,
    MobileCardDirective,
    ActionMenuDirective,
    StatisticCardComponent,
    SlideOverPanelComponent,
    AddMerchantFormComponent,
  ],
  templateUrl: './merchants.component.html',
  styleUrls: ['./merchants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MerchantsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly merchantService = inject(SharedMerchantService);
  private readonly categoryService = inject(CategoryService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  /** Category lookup map: externalId → display name */
  private readonly categoryMap = signal<Map<string, string>>(new Map());

  // Loading state
  readonly isLoading = signal(false);

  // Slide-over panel state
  readonly isAddMerchantPanelOpen = signal(false);
  readonly addMerchantPanelConfig: SlideOverConfig = {
    titleKey: 'admin.partners.merchants.addMerchant',
    width: 'xl',
    showCloseButton: true,
    showBackdrop: true,
    closeOnBackdropClick: true,
    closeOnEscape: true,
    showHeader: true,
    headerIcon: 'assets/icons/icon-stat-store.svg', // Store/shop icon SVG path
  };

  // View-merchant panel state
  readonly isViewMerchantPanelOpen = signal(false);
  readonly viewMerchantPanelConfig: SlideOverConfig = {
    titleKey: 'admin.partners.merchants.title',
    width: 'lg',
    showCloseButton: true,
    showBackdrop: true,
    closeOnBackdropClick: true,
    closeOnEscape: true,
    showHeader: true,
    headerIcon: 'assets/icons/icon-stat-store.svg',
  };

  readonly selectedMerchant = signal<Merchant | null>(null);

  // Statistics data from API
  readonly statisticsData = signal<MerchantStatistics>({
    totalApproved: 0,
    totalPending: 0,
    totalActive: 0,
  });

  // Statistics cards configuration - computed from API data
  readonly statisticCards = computed(() =>
    createMerchantStatisticCards(this.statisticsData(), this.formatNumber)
  );

  // Merchants data from API
  readonly merchants = signal<Merchant[]>([]);

  // Table configuration
  readonly tableConfig = MERCHANTS_TABLE_CONFIG;

  // Table header configuration
  readonly tableHeaderConfig = MERCHANTS_TABLE_HEADER_CONFIG;

  // Pagination state
  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  // Search term
  readonly searchTerm = signal('');

  // Close mobile action menu when clicking outside
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.activeMobileMenuId()) {
      this.activeMobileMenuId.set(null);
    }
  }

  // Active dropdown menu ID for mobile cards
  readonly activeMobileMenuId = signal<string | null>(null);

  // Filters
  readonly locationFilter = signal('');
  readonly statusFilter = signal<'PENDING' | 'APPROVED' | 'REJECTED'>(
    'APPROVED'
  );
  readonly agencyFilter = signal('');
  readonly rejectReason = signal('');

  ngOnInit(): void {
    this.loadCategories();
    this.loadMerchants();
  }

  /**
   * Load categories from API to build lookup map for table display
   */
  private loadCategories(): void {
    this.categoryService
      .findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          const map = new Map<string, string>();
          for (const cat of categories) {
            const name = this.resolveCategoryName(cat.name);
            map.set(cat.externalId, name);
          }
          this.categoryMap.set(map);

          // Re-map merchants if already loaded (categories may arrive after merchants)
          if (this.merchants().length > 0) {
            this.loadMerchants();
          }
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
        },
      });
  }

  /**
   * Resolve category name from LocalizedString based on current language
   */
  private resolveCategoryName(name: LocalizedString): string {
    return this.translationService.getLocalizedValue(name, 'vi');
  }

  /**
   * Resolve businessCategory UUID to readable name using category lookup map.
   * Falls back to mapBusinessCategory for non-UUID values.
   */
  private resolveMerchantCategory(category: string | null): string {
    if (!category) return '';
    const name = this.categoryMap().get(category);
    return name ?? mapBusinessCategory(category);
  }

  /**
   * Load merchants from API with statistics
   */
  private loadMerchants(): void {
    this.isLoading.set(true);

    const { page, pageSize } = this.pagination();

    const params: any = {
      page,
      limit: pageSize,
      include: 'statistics',
    };

    if (this.statusFilter()) {
      params.approvalStatus = this.statusFilter() as
        | 'PENDING'
        | 'APPROVED'
        | 'REJECTED';
    }

    this.merchantService
      .findAll(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const merchants = response.data.map((item) =>
            this.mapApiResponseToMerchant(item)
          );
          this.merchants.set(merchants);

          this.pagination.update((prev) => ({
            ...prev,
            total: response.total,
          }));

          if (response.statistics) {
            this.statisticsData.set(response.statistics);
          }

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load merchants:', error);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Map API response to Merchant interface for display
   */
  private mapApiResponseToMerchant(item: MerchantApiResponse): Merchant {
    return {
      id: item.externalId,
      code: item.externalId.toUpperCase(),
      name: item.name,
      initials: generateMerchantInitials(item.name),
      initialsColor: generateMerchantInitialsColor(item.name),
      phone: item.phone ?? '',
      address: item.address ?? '',
      city: item.city ?? '',
      contactName: item.contactName ?? '',

      // Related entities (grouped)
      agency: item.agency ?? null,
      brand: item.brand ?? null,
      owner: item.owner ?? null,

      // Flattened for table display
      agencyName: item.agency?.name ?? '',
      brandName: item.brand?.name ?? '',
      brandSlug: item.brand?.slug ?? '',
      ownerName: item.owner?.name ?? '',
      ownerEmail: item.owner?.email ?? '',

      businessType: mapBusinessType(item.businessType),
      businessCategory: this.resolveMerchantCategory(item.businessCategory),
      approvalStatus: mapMerchantApprovalStatus(item.approvalStatus),
      operationalStatus: mapMerchantOperationalStatus(item.operationalStatus),
      averageRating: item.averageRating,
      totalReviews: item.totalReviews,

      // Tags
      tags: (item.tags ?? []).map((tag) => ({
        code: tag.code,
        name: mapTagName(tag.name),
        icon: tag.icon,
        color: tag.color,
      })),

      // Counts
      productCount: item.productCount ?? 0,
      orderCount: item.orderCount ?? 0,

      createdAt: item.createdAt,
    };
  }

  /**
   * Format number with thousand separators
   */
  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }

  // Event handlers
  onMenuAction(action: string, merchant: Merchant): void {
    this.activeMobileMenuId.set(null);

    switch (action) {
      case 'view':
        this.onViewMerchant(merchant);
        break;
      case 'activate':
      case 'activation':
        // Khi cửa hàng đang chờ duyệt, "Kích hoạt" sẽ đồng thời approve
        if (merchant.approvalStatus === 'PENDING') {
          this.approveMerchant(merchant);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Toggle mobile card action menu
   */
  toggleMobileMenu(event: Event, merchantId: string): void {
    event.stopPropagation();
    this.activeMobileMenuId.update((current) =>
      current === merchantId ? null : merchantId
    );
  }

  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({
      ...prev,
      page: event.page,
    }));
    this.loadMerchants();
  }

  onSortChange(event: TableSortEvent): void {
    console.log('Sort changed:', event);
    // TODO: Implement sorting logic
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    // TODO: Implement search filtering
  }

  onAddMerchant(): void {
    this.isAddMerchantPanelOpen.set(true);
  }

  /** Close add merchant panel */
  closeAddMerchantPanel(): void {
    this.isAddMerchantPanelOpen.set(false);
  }

  onViewMerchant(merchant: Merchant): void {
    this.rejectReason.set('');
    this.selectedMerchant.set(merchant);
    this.isViewMerchantPanelOpen.set(true);
  }

  closeViewMerchantPanel(): void {
    this.rejectReason.set('');
    this.isViewMerchantPanelOpen.set(false);
    this.selectedMerchant.set(null);
  }

  onRejectReasonChange(value: string): void {
    this.rejectReason.set(value);
  }

  /** Reference to the add merchant form component */
  private readonly addMerchantForm = viewChild(AddMerchantFormComponent);

  /** Handle add merchant form submission */
  onAddMerchantSubmit(formData: AdminCreateMerchantRequest): void {
    this.merchantService
      .adminCreate(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Reset loading state first
          this.addMerchantForm()?.isLoading.set(false);

          // Show success modal
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate(
              'admin.partners.merchants.createSuccess'
            )
          );

          // Close panel, reset form, reload list
          this.closeAddMerchantPanel();
          this.addMerchantForm()?.resetForm();
          this.loadMerchants();
        },
        error: (error) => {
          console.error('Failed to create merchant:', error);

          // Reset loading state
          this.addMerchantForm()?.isLoading.set(false);

          // Show error modal with error details
          const errorMessage =
            error?.error?.message ||
            this.translationService.translate(
              'admin.partners.merchants.createError'
            );
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            errorMessage
          );
        },
      });
  }

  // Header event handlers
  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    // TODO: Implement search filtering
  }

  onHeaderFilter(event: TableHeaderFilterEvent): void {
    console.log('Header filter clicked:', event.filterId);
    switch (event.filterId) {
      case 'location':
        // TODO: Open location filter dropdown
        break;
      case 'status':
        // TODO: Open status filter dropdown
        break;
      case 'agency':
        // TODO: Open agency filter dropdown
        break;
    }
  }

  onHeaderAction(event: TableHeaderActionEvent): void {
    switch (event.actionId) {
      case 'add':
        this.onAddMerchant();
        break;
      case 'column':
        console.log('Column selector clicked');
        // Column visibility is handled by DataTable internally
        break;
      default:
        console.log('Header action:', event.actionId);
    }
  }

  approveMerchant(merchant: Merchant): void {
    this.modalService.showConfirmation(
      this.translationService.translate('common.status.warning'),
      this.translationService.translate(
        'admin.partners.merchants.approveConfirm'
      ),
      () => {
        this.merchantService
          .updateStatus(merchant.id, 'APPROVED')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.modalService.showSuccess(
                this.translationService.translate('common.status.success'),
                this.translationService.translate(
                  'admin.partners.merchants.approveSuccess'
                )
              );
              this.loadMerchants();
            },
            error: (error) => {
              console.error('Failed to approve merchant:', error);
              this.modalService.showError(
                this.translationService.translate('common.status.error'),
                this.translationService.translate(
                  'admin.partners.merchants.approveError'
                )
              );
            },
          });
      }
    );
  }

  rejectMerchant(merchant: Merchant): void {
    const reason = this.rejectReason().trim();
    if (!reason) {
      this.modalService.showError(
        this.translationService.translate('common.status.error'),
        this.translationService.translate(
          'admin.partners.merchants.rejectReasonRequired'
        )
      );
      return;
    }

    this.merchantService
      .updateStatus(merchant.id, 'REJECTED', reason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate(
              'admin.partners.merchants.rejectSuccess'
            )
          );
          this.closeViewMerchantPanel();
          this.loadMerchants();
        },
        error: (error) => {
          console.error('Failed to reject merchant:', error);
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            this.translationService.translate(
              'admin.partners.merchants.rejectError'
            )
          );
        },
      });
  }

  onStatisticCardClick(labelKey: string): void {
    // Click "Tổng số cửa hàng" -> chỉ hiển thị cửa hàng đã duyệt
    if (labelKey === 'admin.partners.merchants.stats.totalStores') {
      this.statusFilter.set('APPROVED');
    }

    // Click "Cửa hàng chờ duyệt" -> lọc theo PENDING
    if (labelKey === 'admin.partners.merchants.stats.pendingApproval') {
      this.statusFilter.set('PENDING');
    }

    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadMerchants();
  }
}
