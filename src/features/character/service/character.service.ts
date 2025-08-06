import { Injectable } from '@nestjs/common';
import { AppContext } from '@shared/decorator/context.decorator';
import { AppLogger } from '@root/shared-libs/logger';
import { basename } from 'path';
import { GrpcClient } from '@shared/utilities/grpc-client';

import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { CharacterServiceClient, CreateCharacterProfileResponse } from '@root/proto-interface/character.proto.interface';
@Injectable()
export class CharacterService {
  private characterService: CharacterServiceClient;
  constructor(private appLogger: AppLogger) {
    const grpcClient = new GrpcClient<CharacterServiceClient>({
      package: 'character',
      protoPath: 'src/proto/character.proto',
      url: '0.0.0.0:4003',
      serviceName: 'CharacterService',
    });

    this.characterService = grpcClient.getService();
  }

  async createCharacter(
    context: AppContext,
  ): Promise<string> {
    return 'Hello';
  }
}
