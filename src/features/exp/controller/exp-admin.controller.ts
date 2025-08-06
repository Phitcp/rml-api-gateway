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
import { ExpAdminService } from '../service/exp-admin.service';

import { RbacGuard, RbacMeta } from '@shared/guard/rbac.guard';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';
import {
  GatewayCreateExpResourceDto,
  GatewayCreateExpResourceVO,
} from '../dto/exp.dto';

@ApiTags('Exp Resource')
@Controller('admin/exp')
@UseGuards(JwtGuard)
export class ExpResourceAdminController {
  constructor(private readonly expAdminService: ExpAdminService) {}

  @RbacMeta({
    resource: 'exp_resource',
    action: 'update:all',
  })
  @UseGuards(RbacGuard)
  @ApiOperation({ summary: 'Create exp resource for app' })
  @ApiBody({
    description: 'Create exp resource body',
    type: GatewayCreateExpResourceDto,
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create Exp Resource successfully',
    type: GatewayCreateExpResourceVO,
  })
  @Post('/exp-resource')
  async createExpResource(
    @Context() context: AppContext,
    @Body() body: GatewayCreateExpResourceDto,
  ) {
    return await this.expAdminService.createExpResource(context, body);
  }
}
