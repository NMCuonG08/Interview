import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MerchantOrderItemResponse,
  OrderService,
  TranslatePipe,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">{{ 'admin.nav.orders' | translate }}</h1>
        <p class="page-subtitle">Review pending orders and dispatch courier.</p>
      </div>

      <div class="page-content">
        <div class="toolbar">
          <label for="status">Status</label>
          <select
            id="status"
            [value]="statusFilter()"
            (change)="onStatusFilterChange($event)"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            class="refresh"
            (click)="loadOrders()"
            [disabled]="isLoading()"
          >
            Refresh
          </button>
        </div>

        <p *ngIf="errorMessage()" class="error">{{ errorMessage() }}</p>

        <p *ngIf="!isLoading() && orders().length === 0" class="empty">
          No orders found.
        </p>

        <table *ngIf="orders().length > 0" class="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Courier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders()">
              <td>{{ order.externalId }}</td>
              <td>{{ order.customerName || order.customerEmail }}</td>
              <td>{{ order.itemCount }}</td>
              <td>{{ formatMoney(order.totalAmount) }} VND</td>
              <td>
                <span
                  class="status"
                  [class.pending]="order.status === 'pending'"
                  [class.confirmed]="order.status === 'confirmed'"
                  [class.cancelled]="order.status === 'cancelled'"
                >
                  {{ order.status || 'unknown' }}
                </span>
              </td>
              <td>{{ order.courierExternalId || '-' }}</td>
              <td>
                <button
                  type="button"
                  class="approve"
                  (click)="handleAction(order, 'accept')"
                  [disabled]="
                    !canUpdate(order) || isUpdatingOrder(order.externalId)
                  "
                >
                  Accept
                </button>
                <button
                  type="button"
                  class="reject"
                  (click)="handleAction(order, 'reject')"
                  [disabled]="
                    !canUpdate(order) || isUpdatingOrder(order.externalId)
                  "
                >
                  Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button
            type="button"
            (click)="previousPage()"
            [disabled]="page() <= 1 || isLoading()"
          >
            Previous
          </button>
          <span>Page {{ page() }} / {{ totalPages() }}</span>
          <button
            type="button"
            (click)="nextPage()"
            [disabled]="page() >= totalPages() || isLoading()"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
      }

      .page-header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
      }

      .page-title {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-text-primary);
      }

      .page-subtitle {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .page-content {
        padding: var(--spacing-6);
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        display: grid;
        gap: var(--spacing-4);
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .toolbar select,
      .toolbar button,
      .pagination button {
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.4rem 0.7rem;
        background: #fff;
      }

      .orders-table {
        width: 100%;
        border-collapse: collapse;
      }

      .orders-table th,
      .orders-table td {
        text-align: left;
        padding: 0.65rem 0.5rem;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: middle;
      }

      .status {
        display: inline-flex;
        border-radius: 999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 700;
      }

      .status.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status.confirmed {
        background: #dcfce7;
        color: #166534;
      }

      .status.cancelled {
        background: #fee2e2;
        color: #991b1b;
      }

      .approve,
      .reject {
        border: 0;
        border-radius: 0.4rem;
        padding: 0.35rem 0.65rem;
        cursor: pointer;
      }

      .approve {
        background: #16a34a;
        color: #fff;
        margin-right: 0.4rem;
      }

      .reject {
        background: #dc2626;
        color: #fff;
      }

      .approve:disabled,
      .reject:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .empty {
        color: #64748b;
      }

      .error {
        color: #b91c1c;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.6rem;
        padding: 0.6rem 0.8rem;
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.65rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<MerchantOrderItemResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly updatingOrderIds = signal<string[]>([]);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly statusFilter = signal('pending');

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit()))
  );

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService
      .findMerchantOrders({
        page: this.page(),
        limit: this.limit(),
        status: this.statusFilter() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.orders.set(response.data);
          this.total.set(response.total);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || 'Failed to load orders for this merchant.'
          );
          this.orders.set([]);
          this.total.set(0);
          this.isLoading.set(false);
        },
      });
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
    this.page.set(1);
    this.loadOrders();
  }

  canUpdate(order: MerchantOrderItemResponse): boolean {
    return order.status === 'pending';
  }

  isUpdatingOrder(orderExternalId: string): boolean {
    return this.updatingOrderIds().includes(orderExternalId);
  }

  handleAction(
    order: MerchantOrderItemResponse,
    action: 'accept' | 'reject'
  ): void {
    if (!this.canUpdate(order)) {
      return;
    }

    this.updatingOrderIds.update((ids) => [...ids, order.externalId]);

    this.orderService
      .updateMerchantOrderStatus(order.externalId, { action })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updatingOrderIds.update((ids) =>
            ids.filter((id) => id !== order.externalId)
          );
          this.loadOrders();
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message ||
              `Failed to ${action} order ${order.externalId}`
          );
          this.updatingOrderIds.update((ids) =>
            ids.filter((id) => id !== order.externalId)
          );
        },
      });
  }

  previousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.page.update((p) => p - 1);
    this.loadOrders();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.page.update((p) => p + 1);
    this.loadOrders();
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 0,
    }).format(value || 0);
  }
}
