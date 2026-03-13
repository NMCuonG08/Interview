import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ProductListResponse,
  ProductResponse,
  ProductService,
} from '@vhandelivery/shared-ui';

@Injectable({ providedIn: 'root' })
export class StorefrontProductStateService {
  private readonly productService = inject(ProductService);

  readonly products = signal<ProductResponse[]>([]);
  readonly listLoading = signal(false);
  readonly listError = signal<string | null>(null);

  readonly detail = signal<ProductResponse | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  readonly page = signal(1);
  readonly limit = signal(12);
  readonly total = signal(0);

  readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit()))
  );

  loadPublic(page = this.page(), limit = this.limit()): void {
    this.page.set(page);
    this.limit.set(limit);
    this.listLoading.set(true);
    this.listError.set(null);

    this.productService.findPublic({ page, limit }).subscribe({
      next: (response) => {
        this.products.set(response.data ?? []);
        this.total.set(this.extractTotal(response));
        this.listLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load public products:', error);
        this.products.set([]);
        this.total.set(0);
        this.listLoading.set(false);
        this.listError.set('load_failed');
      },
    });
  }

  loadDetail(externalId: string): void {
    this.detailLoading.set(true);
    this.detailError.set(null);

    this.productService.findByExternalId(externalId).subscribe({
      next: (product) => {
        this.detail.set(product);
        this.detailLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load product detail:', error);
        this.detail.set(null);
        this.detailLoading.set(false);
        this.detailError.set('load_failed');
      },
    });
  }

  clearDetail(): void {
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(false);
  }

  private extractTotal(response: ProductListResponse): number {
    if (typeof response.total === 'number') {
      return response.total;
    }

    if (response.meta && typeof response.meta.total === 'number') {
      return response.meta.total;
    }

    return response.data?.length ?? 0;
  }
}
