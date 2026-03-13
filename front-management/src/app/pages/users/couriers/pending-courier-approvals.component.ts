import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  CourierService,
  CourierResponse,
  CourierApprovalStatus,
  TranslatePipe,
  TranslationService,
} from '@vhandelivery/shared-ui';
import {
  DataTableComponent,
  TableCellDirective,
} from '../../../shared/components/data-table/data-table.component';
import {
  TablePageEvent,
  TablePagination,
  TableHeaderSearchEvent,
} from '../../../shared/interfaces/table.interface';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import {
  PENDING_COURIERS_TABLE_CONFIG,
  PENDING_COURIERS_TABLE_HEADER_CONFIG,
} from './pending-courier-approvals.config';

@Component({
  selector: 'app-pending-courier-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent, TableCellDirective],
  templateUrl: './pending-courier-approvals.component.html',
  styleUrl: './pending-courier-approvals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingCourierApprovalsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly courierService = inject(CourierService);
  private readonly modalService = inject(GlobalModalService);
  private readonly translationService = inject(TranslationService);

  readonly isLoading = signal(false);
  readonly couriers = signal<CourierResponse[]>([]);

  readonly tableConfig = PENDING_COURIERS_TABLE_CONFIG;
  readonly tableHeaderConfig = PENDING_COURIERS_TABLE_HEADER_CONFIG;
  readonly tableData = computed(
    () => this.couriers() as unknown as Record<string, unknown>[]
  );

  readonly pagination = signal<TablePagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50],
  });

  // Filters
  readonly statusFilter = signal<CourierApprovalStatus>('PENDING');
  readonly startDate = signal<string>(''); // yyyy-mm-dd
  readonly endDate = signal<string>(''); // yyyy-mm-dd
  readonly searchTerm = signal('');

  // Reject modal local state (custom modal with textarea)
  readonly isRejectModalOpen = signal(false);
  readonly rejectReason = signal('');
  readonly rejectTarget = signal<CourierResponse | null>(null);
  readonly isRejecting = signal(false);

  constructor() {
    this.loadCouriers();
  }

  private loadCouriers(): void {
    this.isLoading.set(true);

    const pag = this.pagination();
    const approvalStatus = this.statusFilter();

    this.courierService
      .findAll({
        page: pag.page,
        limit: pag.pageSize,
        approvalStatus,
        search: this.searchTerm() || undefined,
        startDate: this.startDate() || undefined,
        endDate: this.endDate() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.couriers.set(res.data);
          this.pagination.update((prev) => ({ ...prev, total: res.total }));
          this.isLoading.set(false);
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            this.translationService.translate('common.status.error');
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            message
          );
          this.isLoading.set(false);
        },
      });
  }

  // Table events
  onPageChange(event: TablePageEvent): void {
    this.pagination.update((prev) => ({ ...prev, page: event.page }));
    this.loadCouriers();
  }

  onHeaderSearch(event: TableHeaderSearchEvent): void {
    this.searchTerm.set(event.query);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  // Filters UI
  setStatus(status: CourierApprovalStatus): void {
    this.statusFilter.set(status);
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  applyDateFilter(): void {
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  clearDateFilter(): void {
    this.startDate.set('');
    this.endDate.set('');
    this.pagination.update((prev) => ({ ...prev, page: 1 }));
    this.loadCouriers();
  }

  // Approve / Reject
  approve(row: Record<string, unknown>): void {
    const courier = row as unknown as CourierResponse;
    this.modalService.showConfirmation(
      this.translationService.translate('modal.confirm'),
      this.translationService.translate('admin.users.couriers.approveConfirm'),
      () => {
        // Optimistic UI: remove from list if we are on PENDING tab
        const previous = this.couriers();
        if (this.statusFilter() === 'PENDING') {
          this.couriers.set(
            previous.filter((c) => c.externalId !== courier.externalId)
          );
          this.pagination.update((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        }

        this.courierService
          .approve(courier.externalId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.modalService.showSuccess(
                this.translationService.translate('common.status.success'),
                this.translationService.translate('admin.users.couriers.approveSuccess')
              );
              // refresh to ensure consistency
              this.loadCouriers();
            },
            error: (err) => {
              // rollback optimistic update
              this.couriers.set(previous);
              const message =
                err?.error?.message ||
                this.translationService.translate('admin.users.couriers.approveError');
              this.modalService.showError(
                this.translationService.translate('common.status.error'),
                message
              );
            },
          });
      }
    );
  }

  openReject(row: Record<string, unknown>): void {
    this.rejectTarget.set(row as unknown as CourierResponse);
    this.rejectReason.set('');
    this.isRejectModalOpen.set(true);
  }

  closeReject(): void {
    if (this.isRejecting()) return;
    this.isRejectModalOpen.set(false);
    this.rejectTarget.set(null);
    this.rejectReason.set('');
  }

  confirmReject(): void {
    const target = this.rejectTarget();
    const reason = this.rejectReason().trim();
    if (!target) return;
    if (!reason) {
      this.modalService.showWarning(
        this.translationService.translate('common.status.warning'),
        this.translationService.translate('admin.users.couriers.rejectReasonRequired')
      );
      return;
    }

    this.isRejecting.set(true);

    // Optimistic UI: remove from list if we are on PENDING tab
    const previous = this.couriers();
    if (this.statusFilter() === 'PENDING') {
      this.couriers.set(previous.filter((c) => c.externalId !== target.externalId));
      this.pagination.update((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
    }

    this.courierService
      .reject(target.externalId, reason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isRejecting.set(false);
          this.isRejectModalOpen.set(false);
          this.modalService.showSuccess(
            this.translationService.translate('common.status.success'),
            this.translationService.translate('admin.users.couriers.rejectSuccess')
          );
          this.loadCouriers();
        },
        error: (err) => {
          this.isRejecting.set(false);
          // rollback optimistic update
          this.couriers.set(previous);
          const message =
            err?.error?.message ||
            this.translationService.translate('admin.users.couriers.rejectError');
          this.modalService.showError(
            this.translationService.translate('common.status.error'),
            message
          );
        },
      });
  }
}

