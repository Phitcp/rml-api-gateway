import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export interface RegisterOtpRequest {
  email: string;
}

export interface RegisterOtpResponse {
  email: string;
  otp: number;
}

export interface VerifyRegisterOtpRequest {
  otp: number;
  email: string;
}

export interface VerifyRegisterOtpResponse {
  slugId: string;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  slugId: string;
  username: string;
  email: string;
  sessionId: string;
  role: string;
}

export interface logOutRequest {
  userId: string;
  sessionId: string;
  accessToken: string;
}

export interface logOutResponse {
  isSuccess: boolean;
  message: string;
}

export interface RotateTokenRequest {
  userId: string;
  refreshToken: string;
  sessionId: string;
}

export interface RotateTokenResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface GetUserTokenQuery {
  slugId: string;
}

export interface GetUserTokensResponse {
  tokens: string[];
}

export interface Character {
  id: string;
  characterName: string;
  characterTitle: string;
  level: number;
  exp: number;
  nextLevelExp: number;
}

export const AUTH_PACKAGE_NAME = "auth";


export interface GetUserFromSlugRequest {
  slugId: string;
}

export interface GetUserFromSlugResponse {
  userId: string;
  slugId: string;
  username: string;
  role: string;
  email: string;
  character: Character | undefined;
}

export interface GetUserListFromSlugListRequest {
  slugIds: string[];
}

export interface GetUserListFromSlugListResponse {
  users: GetUserFromSlugResponse[];
}

export interface AuthServiceClient {
  login(request: LoginRequest, metaData: Metadata): Observable<LoginResponse>;

  logOut(request: logOutRequest, metaData: Metadata): Observable<logOutResponse>;

  rotateToken(request: RotateTokenRequest, metaData: Metadata): Observable<RotateTokenResponse>;

  getUserTokens(request: GetUserTokenQuery, metaData: Metadata): Observable<GetUserTokensResponse>;

  registerOtp(request: RegisterOtpRequest, metaData: Metadata): Observable<RegisterOtpResponse>;

  verifyRegisterOtp(request: VerifyRegisterOtpRequest, metaData: Metadata): Observable<VerifyRegisterOtpResponse>;

  getUserFromSlug(request: GetUserFromSlugRequest, metaData: Metadata): Observable<GetUserFromSlugResponse>;

  getListUserInfoFromSlugs(request: GetUserListFromSlugListRequest, metaData: Metadata): Observable<GetUserListFromSlugListResponse>;
}

