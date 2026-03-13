import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourierListResponse,
  CourierQueryParams,
  CourierResponse,
  CreateCourierRequest,
} from '../interfaces/courier.interface';
import {
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../interfaces/otp.interface';

@Injectable({ providedIn: 'root' })
export class CourierService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/couriers';

  findAll(params: CourierQueryParams = {}): Observable<CourierListResponse> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit)
      httpParams = httpParams.set('limit', params.limit.toString());
    if (params.approvalStatus)
      httpParams = httpParams.set('approvalStatus', params.approvalStatus);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<CourierListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  findByExternalId(externalId: string): Observable<CourierResponse> {
    return this.http.get<CourierResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  // Registration APIs (B2B self-service)
  requestOtp(phone: string): Observable<RequestOtpResponse> {
    const payload: RequestOtpRequest = { phone };
    return this.http.post<RequestOtpResponse>(
      `${this.baseUrl}/otp/request`,
      payload
    );
  }

  verifyOtp(phone: string, code: string): Observable<VerifyOtpResponse> {
    const payload: VerifyOtpRequest = { phone, code };
    return this.http.post<VerifyOtpResponse>(
      `${this.baseUrl}/otp/verify`,
      payload
    );
  }

  register(dto: CreateCourierRequest): Observable<CourierResponse> {
    return this.http.post<CourierResponse>(
      `${this.baseUrl}/register`,
      dto,
      { withCredentials: true }
    );
  }

  approve(externalId: string): Observable<CourierResponse> {
    return this.http.post<CourierResponse>(
      `${this.baseUrl}/${externalId}/approve`,
      {},
      { withCredentials: true }
    );
  }

  reject(externalId: string, rejectionReason: string): Observable<CourierResponse> {
    return this.http.post<CourierResponse>(
      `${this.baseUrl}/${externalId}/reject`,
      { rejectionReason },
      { withCredentials: true }
    );
  }
}

