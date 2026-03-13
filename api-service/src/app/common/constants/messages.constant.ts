export const COMMON_MESSAGES = {
  HELLO_API: 'Hello API',
  USER_NOT_FOUND_IN_CONTEXT: 'User not found in request context',
  MERCHANT_ID_REQUIRED: 'Merchant ID is required',
  INVALID_MERCHANT_ID: 'Invalid Merchant ID',
  INVALID_MERCHANT_ID_FORMAT: 'Invalid Merchant ID format',
};

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCESS_DENIED: 'Access Denied',
  INVALID_REFRESH_TOKEN: 'Invalid Refresh Token',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_OR_EXPIRED_OTP: 'Invalid or expired OTP',
  OTP_VERIFIED_SUCCESSFULLY: 'OTP verified successfully',
  OTP_SENT_SUCCESSFULLY: 'OTP sent successfully',
  OTP_RATE_LIMIT_EXCEEDED: 'Too many OTP requests. Please try again later.',
  INVALID_OR_EXPIRED_VERIFICATION_TOKEN:
    'Invalid or expired verification token',
  INVALID_TOKEN_TYPE: 'Invalid token type',
  PHONE_NUMBER_MISMATCH: 'Phone number does not match the verified token',
  LOGGED_OUT_SUCCESSFULLY: 'Logged out successfully',
  // Google OAuth
  GOOGLE_ACCOUNT_REQUIRES_LINKING:
    'This email is already registered. Please enter your password to link your Google account.',
  GOOGLE_ALREADY_LINKED_OTHER:
    'This Google account is already linked to another user.',
  USER_ALREADY_HAS_GOOGLE: 'Your account already has a Google account linked.',
  CANNOT_UNLINK_ONLY_AUTH:
    'Cannot unlink Google account. Please set a password first.',
  GOOGLE_AUTH_SUCCESS: 'Google authentication successful',
  GOOGLE_LINK_SUCCESS: 'Google account linked successfully',
  GOOGLE_UNLINK_SUCCESS: 'Google account unlinked successfully',
  // Kakao OAuth
  KAKAO_ACCOUNT_REQUIRES_LINKING:
    'This email is already registered. Please enter your password to link your Kakao account.',
  KAKAO_ALREADY_LINKED_OTHER:
    'This Kakao account is already linked to another user.',
  USER_ALREADY_HAS_KAKAO: 'Your account already has a Kakao account linked.',
  KAKAO_AUTH_SUCCESS: 'Kakao authentication successful',
  KAKAO_LINK_SUCCESS: 'Kakao account linked successfully',
  KAKAO_UNLINK_SUCCESS: 'Kakao account unlinked successfully',
  CANNOT_UNLINK_KAKAO_ONLY_AUTH:
    'Cannot unlink Kakao account. Please set a password first.',
  OAUTH_ONLY_ACCOUNT:
    'This account was created with OAuth. Please login with your OAuth provider or set a password.',
  OAUTH_ONLY_ACCOUNT_PROVIDERS: (providers: string) =>
    `Tài khoản này được tạo bằng ${providers}. Vui lòng đăng nhập bằng ${providers} hoặc đặt mật khẩu trong cài đặt tài khoản.`,
  PASSWORD_SET_SUCCESS: 'Password has been set successfully',
  PASSWORD_ALREADY_SET: 'Account already has a password set',
};

export const PRODUCT_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Product not found',
  PERMISSION_DENIED_MODIFICATION:
    'You do not have permission to modify this product',
  PERMISSION_DENIED_CREATION:
    'You do not have permission to create products for this merchant',
};

export const CATEGORY_MESSAGES = {
  NOT_FOUND: 'Category not found',
};

export const BRAND_MESSAGES = {
  AGENCY_REQUIRED: 'You must own an Agency to create a Brand',
  NOT_FOUND: 'Brand not found',
  NOT_OWNER: 'You do not own this Brand',
};

export const RESOURCE_MESSAGES = {
  NOT_FOUND: (target: string) => `${target} not found`,
  OPERATION_DENIED: (target: string, status: string) =>
    `Operation denied. ${target} status is ${status}. Please contact support.`,
};
