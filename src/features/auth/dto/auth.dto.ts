import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

const userNameMinLength = 6;
const passwordMinLength = 6;

export class GatewayRegisterRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(userNameMinLength, {
    message: `User name need longer than ${userNameMinLength}`,
  })
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(userNameMinLength, {
    message: `User name password need to be longer than ${passwordMinLength}`,
  })
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class GatewayLoginRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(userNameMinLength, {
    message: `User name need longer than ${userNameMinLength}`,
  })
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(userNameMinLength, {
    message: `User name need longer than ${userNameMinLength}`,
  })
  password: string;
}

export class GatewayRotateTokenRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty()
  @IsNotEmpty()
  sessionId: string;
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
  userId: string;
}

export class GatewayRegisterResponseDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}

export class GatewayLoginResponseDto {
  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsString()
  refreshToken: string;

  @ApiProperty()
  @IsString()
  userId: string;

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
