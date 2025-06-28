import { Metadata } from "@grpc/grpc-js";
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "auth";

export interface RegisterRequestDto {
  username: string;
  password: string;
  email: string;
}

export interface RegisterResponseDto {
  username: string;
  email: string;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  email: string;
  sessionId: string;
  role: string;
}

export interface RotateTokenRequestDto {
  userId: string;
  refreshToken: string;
  sessionId: string;
}

export interface RotateTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface GetUserTokenQueryDto {
  userId: string;
}

export interface GetUserTokensResponseDto {
  tokens: string[];
}

export const AUTH_PACKAGE_NAME = "auth";

export interface AuthServiceClient {
  register(request: RegisterRequestDto, metadata: Metadata): Observable<RegisterResponseDto>;

  login(request: LoginRequestDto, metadata: Metadata): Observable<LoginResponseDto>;

  rotateToken(request: RotateTokenRequestDto, metadata: Metadata): Observable<RotateTokenResponseDto>;

  getUserTokens(request: GetUserTokenQueryDto, metadata: Metadata): Observable<GetUserTokensResponseDto>;
}

export const AUTH_SERVICE_NAME = "AuthService";
