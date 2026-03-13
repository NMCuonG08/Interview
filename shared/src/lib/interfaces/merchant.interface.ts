import { BUSINESS_TYPE } from '../types/business.type';
import { MERCHANT_OPERATIONAL_STATUS } from '../types/merchant-status.type';

/**
 * Request payload for merchant self-registration (B2B flow).
 * Requires verificationToken from OTP verification.
 */
export interface RegisterMerchantRequest {
  name: string;
  phone: string;
  verificationToken: string;
  address: string;
  city: string;
  contactName: string;
  businessType: BUSINESS_TYPE;
  businessCategory: string;
  hasBusinessLicense: boolean;
  referralSource?: string;
  socialLinks?: string;
}

/**
 * Request payload for admin creating a merchant from management panel.
 * No verificationToken needed — admin has authority.
 */
export interface AdminCreateMerchantRequest {
  name: string;
  phone: string;
  address: string;
  city: string;
  ownerName: string;
  contactName: string;
  businessType: BUSINESS_TYPE;
  businessCategory: string;
  operationalStatus: MERCHANT_OPERATIONAL_STATUS;
  hasBusinessLicense: boolean;
  // Optional fields
  referralSource?: string;
  socialLinks?: string;
  agencyId?: string;
  brandId?: string;
  logoUrl?: string;
}

export interface MerchantResponse {
  id: number;
  externalId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  contactName?: string | null;
  businessType?: BUSINESS_TYPE | null;
  referralSource?: string | null;
  hasBusinessLicense?: boolean | null;
  metadata?: unknown;
  status?: string | null;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string | Date | null;
  approvedBy?: number | null;
  rejectedAt?: string | Date | null;
  rejectedBy?: number | null;
  rejectionReason?: string | null;
  ownerId?: number | null;
  brandId?: number | null;
  agencyId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

/**
 * Tag info from API
 */
export interface MerchantTagInfo {
  code: string;
  name: unknown;
  icon: string | null;
  color: string | null;
}

/**
 * Agency info (grouped from API)
 */
export interface MerchantAgencyInfo {
  externalId: string;
  name: string;
  phone: string | null;
}

/**
 * Brand info (grouped from API)
 */
export interface MerchantBrandInfo {
  externalId: string;
  name: string;
  slug: string | null;
}

/**
 * Owner info (grouped from API)
 */
export interface MerchantOwnerInfo {
  name: string;
  email: string | null;
  phone: string | null;
}

/**
 * Merchant API response with all fields for list display
 */
export interface MerchantApiResponse {
  externalId: string;
  name: string;
  address: string | null;
  city: string | null;
  contactName: string | null;
  businessType: string | null;
  businessCategory: string | null;
  phone: string | null;
  approvalStatus: string;
  approvedAt?: string | null;
  approvedBy?: number | null;
  rejectedAt?: string | null;
  rejectedBy?: number | null;
  rejectionReason?: string | null;
  operationalStatus: string;
  averageRating: number;
  totalReviews: number;

  // Related entities (grouped)
  agency: MerchantAgencyInfo | null;
  brand: MerchantBrandInfo | null;
  owner: MerchantOwnerInfo | null;

  // Tags
  tags: MerchantTagInfo[];

  // Counts
  productCount: number;
  orderCount: number;

  createdAt: string;
}

/**
 * Statistics for merchants
 */
export interface MerchantStatistics {
  totalApproved: number;
  totalPending: number;
  totalActive: number;
}

/**
 * List response from API with pagination and optional statistics
 */
export interface MerchantListResponse {
  data: MerchantApiResponse[];
  total: number;
  page: number;
  limit: number;
  statistics?: MerchantStatistics;
}

/**
 * Query parameters for merchants API
 */
export interface MerchantQueryParams {
  page?: number;
  limit?: number;
  include?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}
