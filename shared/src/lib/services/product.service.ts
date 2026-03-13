import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductListResponse,
  ProductQueryParams,
  ProductResponse,
} from '../interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  findAllByMerchant(
    merchantExternalId: string,
    params: Omit<ProductQueryParams, 'merchantExternalId'> = {}
  ): Observable<ProductListResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ProductListResponse>(
      `${this.baseUrl}/merchant/${merchantExternalId}`,
      {
        params: httpParams,
        withCredentials: true,
      }
    );
  }

  findMine(
    params: Omit<ProductQueryParams, 'merchantExternalId'> = {}
  ): Observable<ProductListResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ProductListResponse>(`${this.baseUrl}/merchant/me`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  findPublic(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ProductListResponse>(`${this.baseUrl}/public`, {
      params: httpParams,
    });
  }

  findByExternalId(externalId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${externalId}`);
  }

  create(
    formData: FormData,
    merchantExternalId?: string
  ): Observable<ProductResponse> {
    const endpoint = merchantExternalId
      ? `${this.baseUrl}?merchantId=${merchantExternalId}`
      : this.baseUrl;

    return this.http.post<ProductResponse>(endpoint, formData, {
      withCredentials: true,
    });
  }

  update(
    externalId: string,
    payload: Partial<ProductResponse> & {
      name?: unknown;
      description?: unknown;
    }
  ): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(
      `${this.baseUrl}/${externalId}`,
      payload,
      { withCredentials: true }
    );
  }

  delete(externalId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }
}
