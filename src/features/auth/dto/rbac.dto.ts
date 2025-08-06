import { ApiProperty } from '@nestjs/swagger';
import { CreateResourcesRequest, CreateResourcesResponse, CreateRolesRequest, CreateRolesResponse, GrantAccessToRoleRequest, GrantAccessToRoleResponse } from '@root/proto-interface/rbac.proto.interface';
import { IsNotEmpty, IsString } from 'class-validator';

export class GatewayCreateRolesRequestDto implements CreateRolesRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class GatewayCreateRolesResponseDto implements CreateRolesResponse {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class GatewayCreateResourcesRequestDto implements CreateResourcesRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  resource: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class GatewayCreateResourcesResponseDto implements CreateResourcesResponse {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  resource: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class GatewayGrantAccessToRoleRequestDto implements GrantAccessToRoleRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  resource: string;

  @ApiProperty({ type: [String] })
  @IsNotEmpty()
  actions: string[];
}

export class GatewayGrantAccessToRoleResponseDto implements GrantAccessToRoleResponse {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  resource: string;

  @ApiProperty({ type: [String] })
  @IsNotEmpty()
  actions: string[];
}
