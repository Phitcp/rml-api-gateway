import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Query,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AppContext, Context } from '@shared/decorator/context.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import {
  GatewayGetUserTokenQueryDto,
  GatewayLoginRequestDto,
  GatewayLoginResponseDto,
  GatewayRegisterOtpRequest,
  GatewayRegisterOtpResponse,
  GatewayRotateTokenRequestDto,
  GatewayRotateTokenResponseDto,
  GatewayVerifyRegisterOtpRequest,
} from '../dto/auth.dto';
import { JwtGuard, RotateTokenMeta } from '@shared/guard/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Send otp register to user by email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Send otp successfully',
    type: GatewayRegisterOtpResponse,
  })
  @ApiBody({
    description: 'User email to send otp',
    type: GatewayRegisterOtpRequest,
    required: true,
  })
  @Post('/register-email')
  async registerEmail(
    @Body() registerDto: GatewayRegisterOtpRequest,
    @Context() context: AppContext,
  ) {
    return await this.authService.registerOtp(context, registerDto);
  }

  @ApiOperation({ summary: 'Verify register otp user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verify user successfully',
    type: GatewayRegisterOtpResponse,
  })
  @ApiBody({
    description: 'User register info',
    type: GatewayVerifyRegisterOtpRequest,
    required: true,
  })
  @Post('/verify-register-otp')
  async verifyRegisterOtp(
    @Body() registerDto: GatewayVerifyRegisterOtpRequest,
    @Context() context: AppContext,
  ) {
    return await this.authService.verifyRegisterOtp(context, registerDto);
  }

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User login successfully',
    type: GatewayLoginResponseDto,
  })
  @ApiBody({
    type: GatewayLoginRequestDto,
    required: true,
  })
  @Post('/login')
  async login(
    @Body() loginDto: GatewayLoginRequestDto,
    @Context() context: AppContext,
  ) {
    return await this.authService.login(context, loginDto);
  }

  
  @RotateTokenMeta({
    isRotateToken: true,
  })
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Rotate refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rotate token for user successfully',
    type: GatewayRotateTokenResponseDto,
  })
  @ApiBody({
    type: GatewayRotateTokenRequestDto,
    required: true,
  })
  @Post('/rotate-token')
  async rotateToken(
    @Body() rotateToken: GatewayRotateTokenRequestDto,
    @Context() context: AppContext,
  ) {
    return await this.authService.rotateToken(context, rotateToken);
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get user token list' })
  @Get('/token')
  async getUserToken(
    @Query() query: GatewayGetUserTokenQueryDto,
    @Context() context: AppContext,
  ) {
    return await this.authService.getTokenForUser(context, query);
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'User logout' })
  @Post('/logout')
  async logOut(
    @Context() context: AppContext,
  ) {
    return await this.authService.logOut(context);
  }
}
