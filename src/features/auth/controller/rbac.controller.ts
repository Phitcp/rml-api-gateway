import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AppContext, Context } from '@shared/decorator/context.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RbacService } from '../service/rbac.service';
import {
  GatewayCreateResourcesRequestDto,
  GatewayCreateResourcesResponseDto,
  GatewayCreateRolesRequestDto,
  GatewayCreateRolesResponseDto,
  GatewayGrantAccessToRoleRequestDto,
  GatewayGrantAccessToRoleResponseDto,
} from '../dto/rbac.dto';
import { RbacGuard, RbacMeta } from '@shared/guard/rbac.guard';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';

@UseGuards(JwtGuard)
@ApiTags('Rbac')
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}
  @UseGuards(RbacGuard)
  @RbacMeta({
    resource: 'admin_data',
    action: 'read:all',
  })
  @ApiOperation({ summary: 'Check user permission per resource' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User permission checked successfully',
  })
  @Get('/permissions')
  async checkPermission() {
    return await this.rbacService.checkPermission();
  }

  @UseGuards(RbacGuard)
  @RbacMeta({
    resource: 'admin_data',
    action: 'update:all',
  })
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Role created successfully',
    type: GatewayCreateRolesResponseDto,
  })
  @ApiBody({
    description: 'Role creation details',
    type: GatewayCreateRolesRequestDto,
    required: true,
  })
  @Post('/role')
  async createRole(
    @Context() context: AppContext,
    @Body() createRoleDto: GatewayCreateRolesRequestDto,
  ): Promise<GatewayCreateRolesResponseDto> {
    return await this.rbacService.createRole(context, createRoleDto);
  }

  @UseGuards(RbacGuard)
  @RbacMeta({
    resource: 'admin_data',
    action: 'update:all',
  })
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Resource created successfully',
    type: GatewayCreateResourcesResponseDto,
  })
  @ApiBody({
    description: 'Resource creation details',
    type: GatewayCreateResourcesRequestDto,
    required: true,
  })
  @Post('/resource')
  async createResource(
    @Context() context: AppContext,
    @Body() createResourceDto: GatewayCreateResourcesRequestDto,
  ): Promise<GatewayCreateResourcesResponseDto> {
    return await this.rbacService.createResource(context, createResourceDto);
  }

  @UseGuards(RbacGuard)
  @RbacMeta({
    resource: 'admin_data',
    action: 'update:all',
  })
  @ApiOperation({ summary: 'Grant access to a role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access granted successfully',
    type: GatewayGrantAccessToRoleResponseDto,
  })
  @ApiBody({
    description: 'Details for granting access to a role',
    type: GatewayGrantAccessToRoleRequestDto,
    required: true,
  })

  @Post('/grant-access')
  async grantAccess(
    @Context() context: AppContext,
    @Body() grantAccessDto: GatewayGrantAccessToRoleRequestDto,
  ): Promise<GatewayGrantAccessToRoleResponseDto> {
    return await this.rbacService.grantAccess(context, grantAccessDto);
  }
}
