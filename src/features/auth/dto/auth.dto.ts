import { ApiProperty } from '@nestjs/swagger';
import { LoginRequest, LoginResponse, RegisterOtpRequest, RegisterOtpResponse, RotateTokenRequest, VerifyRegisterOtpRequest, VerifyRegisterOtpResponse } from '@root/proto-interface/auth.proto.interface';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { Verify } from 'crypto';

export class GatewayRegisterOtpRequest implements RegisterOtpRequest {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class GatewayRegisterOtpResponse implements RegisterOtpResponse {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  otp: number;
}

export class GatewayVerifyRegisterOtpRequest implements VerifyRegisterOtpRequest {
  @ApiProperty()
  @IsNumber()
  otp: number;

  @ApiProperty()
  @IsEmail()
  email: string;
}

export class GatewayVerifyRegisterOtpResponse implements VerifyRegisterOtpResponse {
  @ApiProperty()
  @IsString()
  slugId: string;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsString()
  refreshToken: string;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  role: string;
}

export class GatewayLoginRequestDto implements LoginRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

export class GatewayLoginResponseDto implements LoginResponse {
  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsString()
  refreshToken: string;

  @ApiProperty()
  @IsString()
  slugId: string;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  role: string;
}

export class GatewayRotateTokenRequestDto implements Partial<RotateTokenRequest> {
  @ApiProperty()
  @IsNotEmpty()
  userId: string;
}

export class GatewayLogOutRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  sessionId: string;
}

export class GatewayGetUserTokenQueryDto {
  @ApiProperty()
  @IsNotEmpty()
  slugId: string;
}

export class GatewayRotateTokenResponseDto {
  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsString()
  refreshToken: string;

  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class GatewayLogOutResponseDto {
  @ApiProperty()
  @IsString()
  message: string;
}
