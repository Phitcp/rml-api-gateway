import { Controller, Post, Body, HttpStatus, Query, Get, UseGuards } from '@nestjs/common';
import { AppContext, Context } from '@shared/decorator/context.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { GatewayGetUserTokenQueryDto, GatewayLoginRequestDto, GatewayLoginResponseDto, GatewayRegisterRequestDto, GatewayRegisterResponseDto, GatewayRotateTokenRequestDto, GatewayRotateTokenResponseDto } from '../dto/auth.dto';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';
import { RotateTokenRequestDto } from '@root/proto-interface/auth.proto.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
constructor(
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'Register app user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Create user successfully',
    type: GatewayRegisterResponseDto,
  })
  @ApiBody({
    description: 'User register info',
    type: GatewayRegisterRequestDto,
    required: true,
  })
  @Post('/register')
  async register(
    @Body() registerDto: GatewayRegisterRequestDto,
    @Context() context: AppContext,
  ) {
    return await this.authService.registerUser(context, registerDto);
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
    @Body() rotateToken: RotateTokenRequestDto,
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
}
