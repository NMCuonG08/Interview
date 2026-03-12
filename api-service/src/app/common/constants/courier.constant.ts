export enum COURIER_APPROVAL_STATUS {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Availability of courier to receive orders
export enum COURIER_AVAILABILITY_STATUS {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

// OTP type identifier for courier registration flow
export const COURIER_REGISTRATION_OTP = 'COURIER_REGISTRATION_OTP' as const;

