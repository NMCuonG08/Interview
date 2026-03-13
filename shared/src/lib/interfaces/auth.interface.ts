export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  phone: string;
}

export interface UserProfile {
  externalId: string;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
  roles: string[];
}

export interface AuthResponse {
  access_token: string;
  user: UserProfile;
  permissions: string[];
}

// Google OAuth
export interface GoogleLinkRequest {
  email: string;
  password: string;
  googleId: string;
  displayName?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface GoogleAuthRequiresLinking {
  requiresLinking: true;
  email: string;
  googleId: string;
  displayName: string;
  avatarUrl: string;
  message: string;
}

// Kakao OAuth
export interface KakaoLinkRequest {
  email: string;
  password: string;
  kakaoId: string;
  displayName?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface KakaoAuthRequiresLinking {
  requiresLinking: true;
  email: string;
  kakaoId: string;
  displayName: string;
  avatarUrl: string;
  message: string;
}

export interface LinkedAccount {
  id: number;
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE' | 'KAKAO';
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}
