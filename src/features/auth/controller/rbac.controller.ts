import { Controller, Post, Body, HttpStatus, Query, Get, UseGuards } from '@nestjs/common';
import { AppContext, Context } from '@shared/decorator/context.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { GatewayGetUserTokenQueryDto, GatewayLoginRequestDto, GatewayLoginResponseDto, GatewayRegisterRequestDto, GatewayRegisterResponseDto, GatewayRotateTokenRequestDto, GatewayRotateTokenResponseDto } from '../dto/auth.dto';
import { JwtGuard } from '@shared/guard/jwt-auth-guard';
import { RotateTokenRequestDto } from '@root/proto-interface/auth.proto.interface';
import { RbacService } from '../service/rbac.service';

@ApiTags('Rbac')
@Controller('rbac')
export class RbacController {
constructor(
    private readonly rbacService: RbacService,
  ) {}

  @ApiOperation({ summary: 'Check user permission per resource' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User permission checked successfully',
  })
  @Get('/permissions')
  async checkPermission() {
    return await this.rbacService.checkPermission();
  }

  @ApiOperation({ summary: 'Check user role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role checked successfully',
  })
  @Get('/roles')
  async checkRole() {
    return await this.rbacService.hasRole();
  }

  @ApiOperation({ summary: 'Get user roles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User roles retrieved successfully',
  })
  @Get('/roles')
  async getUserRoles() {
    return await this.rbacService.getUserRoles();
  }
}
