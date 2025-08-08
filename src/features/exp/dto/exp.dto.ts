import { ApiProperty } from '@nestjs/swagger';
import { CreateExpResourceRequest, CreateExpResourceResponse } from '@root/proto-interface/exp.proto.interface';
import { CommonLocalization } from '@shared/interfaces/common';
import { IsEnum, IsOptional } from 'class-validator';

export enum ExpResourceCategory {
  QUEST = 'quest',
  EVENT = 'event',
}

export enum ExpResourceType {
  LIMITED_ACCOUNT = 'LIMITED_ACCOUNT',
  LIMITED_SERVER = 'LIMITED_SERVER',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export enum ExpResourceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  EXHAUSTED = 'EXHAUSTED',
}

export class GatewayCreateExpResourceDto implements CreateExpResourceRequest {
  @ApiProperty()
  title: CommonLocalization | undefined;

  @ApiProperty()
  description: CommonLocalization | undefined;

  @ApiProperty()
  @IsEnum(ExpResourceType)
  type: ExpResourceType;

  @ApiProperty()
  @IsOptional()
  maxClaimAccount: number;

  @ApiProperty()
  @IsOptional()
  maxClaimServer: number;

  @ApiProperty()
  @IsEnum(ExpResourceStatus)
  status: ExpResourceStatus;

  @ApiProperty()
  expAmount: number;
}

export class GatewayCreateExpResourceVO implements CreateExpResourceResponse{
  @ApiProperty()
  isSuccess: boolean;

  @ApiProperty()
  id: string;
}

// #region user service dto
export class ClaimExpRequestDto {
  @ApiProperty()
  expAmount: number;

    @ApiProperty()
  expResourceId: string;
}