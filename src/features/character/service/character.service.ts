import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AppContext } from '@shared/decorator/context.decorator';
import { AppLogger } from '@root/shared-libs/logger';

import { GrpcClient } from '@shared/utilities/grpc-client';


import { CharacterServiceClient, CreateCharacterProfileResponse } from '@root/proto-interface/character.proto.interface';

@Injectable()
export class CharacterService implements OnModuleDestroy {
  private grpcClient: GrpcClient<CharacterServiceClient>;
  private characterService: CharacterServiceClient;
  
  constructor(private appLogger: AppLogger) {
    // Standard service configuration with connection pooling
    this.grpcClient = new GrpcClient<CharacterServiceClient>({
      package: 'character',
      protoPath: 'src/proto/character.proto',
      url: '0.0.0.0:4003',
      serviceName: 'CharacterService',
      keepaliveTimeMs: 45000,
      maxConnectionAge: 600000,
    });

    this.characterService = this.grpcClient.getService();
    this.appLogger.log('CharacterService initialized with standard gRPC configuration');
  }

  async onModuleDestroy() {
    await this.grpcClient.close();
    this.appLogger.log('CharacterService gRPC connections closed');
  }

  async createCharacter(
    context: AppContext,
  ): Promise<string> {
    // Implementation would go here
    return 'Hello';
  }
}
