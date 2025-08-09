import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AppContext, Context } from '@shared/decorator/context.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExpService } from '../service/exp.service';

import { RbacGuard, RbacMeta } from '@shared/guard/rbac.guard';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';
import {
  ClaimExpRequestDto,
} from '../dto/exp.dto';

@ApiTags('Exp Resource')
@Controller('exp')
@UseGuards(JwtGuard)
export class ExpResourceController {
  constructor(private readonly expService: ExpService) {}

  @RbacMeta({
    resource: 'exp_resource',
    action: 'update:own',
  })
  @UseGuards(RbacGuard)
  @ApiOperation({ summary: 'Claim exp for user' })
  @ApiBody({
    description: 'Claim exp request body',
    type: ClaimExpRequestDto,
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claim Exp successfully',
  })
  @Post('/claim')
  async claimExp(
    @Context() context: AppContext,
    @Body() body: ClaimExpRequestDto,
  ) {
    await this.expService.claimExp(context, body);
  }
}
