import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateOrderRequest,
  MerchantOrderListQuery,
  MerchantOrderListResponse,
  UpdateMerchantOrderStatusRequest,
} from '../interfaces/order.interface';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/orders';

  create(payload: CreateOrderRequest): Observable<unknown> {
    return this.http.post<unknown>(this.baseUrl, payload, {
      withCredentials: true,
    });
  }

  findMerchantOrders(
    query: MerchantOrderListQuery = {}
  ): Observable<MerchantOrderListResponse> {
    let params = new HttpParams();

    if (query.page != null) {
      params = params.set('page', query.page);
    }
    if (query.limit != null) {
      params = params.set('limit', query.limit);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http.get<MerchantOrderListResponse>(
      `${this.baseUrl}/merchant/me`,
      {
        params,
        withCredentials: true,
      }
    );
  }

  updateMerchantOrderStatus(
    orderExternalId: string,
    payload: UpdateMerchantOrderStatusRequest
  ): Observable<unknown> {
    return this.http.patch<unknown>(
      `${this.baseUrl}/${orderExternalId}/merchant-status`,
      payload,
      {
        withCredentials: true,
      }
    );
  }
}
