import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MerchantListResponse,
  MerchantQueryParams,
  MerchantApiResponse,
  RegisterMerchantRequest,
  AdminCreateMerchantRequest,
  MerchantResponse,
} from '../interfaces/merchant.interface';
import {
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../interfaces/otp.interface';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/merchants';

  /**
   * Get paginated list of merchants with optional statistics
   */
  findAll(params: MerchantQueryParams = {}): Observable<MerchantListResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.include) {
      httpParams = httpParams.set('include', params.include);
    }
    if (params.approvalStatus) {
      httpParams = httpParams.set('approvalStatus', params.approvalStatus);
    }

    return this.http.get<MerchantListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  /**
   * Get single merchant by external ID
   */
  findByExternalId(externalId: string): Observable<MerchantApiResponse> {
    return this.http.get<MerchantApiResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  /**
   * Get current authenticated user's owned merchant.
   */
  findMine(): Observable<MerchantApiResponse> {
    return this.http.get<MerchantApiResponse>(`${this.baseUrl}/me`, {
      withCredentials: true,
    });
  }

  /**
   * Request OTP for phone verification
   */
  requestOtp(phone: string): Observable<RequestOtpResponse> {
    const payload: RequestOtpRequest = { phone };
    return this.http.post<RequestOtpResponse>(
      `${this.baseUrl}/otp/request`,
      payload
    );
  }

  /**
   * Verify OTP code
   */
  verifyOtp(phone: string, code: string): Observable<VerifyOtpResponse> {
    const payload: VerifyOtpRequest = { phone, code };
    return this.http.post<VerifyOtpResponse>(
      `${this.baseUrl}/otp/verify`,
      payload
    );
  }

  /**
   * Register new merchant (B2B self-registration with OTP)
   */
  register(payload: RegisterMerchantRequest): Observable<MerchantResponse> {
    return this.http.post<MerchantResponse>(
      `${this.baseUrl}/register`,
      payload
    );
  }

  /**
   * Admin creates a merchant directly (no OTP required)
   */
  adminCreate(
    payload: AdminCreateMerchantRequest
  ): Observable<MerchantResponse> {
    return this.http.post<MerchantResponse>(
      `${this.baseUrl}/admin-create`,
      payload,
      { withCredentials: true }
    );
  }

  /**
   * Update merchant approval status (PENDING / APPROVED / REJECTED)
   */
  updateStatus(
    externalId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Observable<MerchantResponse> {
    return this.http.patch<MerchantResponse>(
      `${this.baseUrl}/${externalId}/status`,
      { status, rejectionReason },
      { withCredentials: true }
    );
  }
}
