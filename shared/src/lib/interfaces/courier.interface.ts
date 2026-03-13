export type CourierApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CourierResponse {
  externalId: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  approvalStatus: CourierApprovalStatus;
  rejectionReason?: string | null;
  status?: string | null; // availability: available/busy/offline
  vehicleType?: string | null;
  currentLocation?: unknown | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
  deletedAt?: string | Date | null;
}

export interface CourierListResponse {
  data: CourierResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface CourierQueryParams {
  page?: number;
  limit?: number;
  approvalStatus?: CourierApprovalStatus;
  search?: string;
  // Optional (backend builder supports it; add when API accepts)
  startDate?: string;
  endDate?: string;
}

export interface CreateCourierRequest {
  name: string;
  phone: string;
  verificationToken: string;
  email?: string;
  vehicleType?: string;
}

