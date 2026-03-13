export interface ProductResponse {
  externalId: string;
  name: unknown; // Localized JSON from backend
  description?: unknown;
  price?: number | string | null;
  currency?: string | null;
  sku?: string | null;
  stock?: number | null;
  isActive?: boolean | null;
  metadata?: unknown;
  merchantId?: number;
  merchantExternalId?: string;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage?: number;
}

export interface ProductListResponse {
  data: ProductResponse[];
  total?: number;
  page?: number;
  limit?: number;
  meta?: PaginationMeta;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  merchantExternalId?: string;
}
