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
import { ExpService } from '../service/exp.service';

import { RbacGuard, RbacMeta } from '@shared/guard/rbac.guard';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';
import {
  GatewayCreateExpResourceDto,
  GatewayCreateExpResourceVO,
} from '../dto/exp.dto';

@ApiTags('Exp Resource')
@Controller('/admin/exp')
@UseGuards(JwtGuard)
@UseGuards(RbacGuard)
export class ExpResourceController {
  constructor(private readonly expService: ExpService) {}

}
