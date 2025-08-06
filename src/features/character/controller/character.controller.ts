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
import { CharacterService } from '../service/character.service';
import { RbacGuard, RbacMeta } from '@shared/guard/rbac.guard';

@ApiTags('Character')
@Controller('character')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}
  @UseGuards(RbacGuard)
  @RbacMeta({
    resource: 'character_info',
    action: 'update:own',
  })
  @ApiOperation({ summary: 'Create Character user data' })
  @ApiBody({
      description: 'Create character body',
      required: true,
    })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hello',
  })
  @Get('/hello')
  async hello(
    @Context() context: AppContext,
  ) {
    // return await this.characterService.createCharacter(context);
    return 'Hello from CharacterController';
  }
}
