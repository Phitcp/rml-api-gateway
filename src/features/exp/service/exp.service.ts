import { AppContext } from '@shared/decorator/context.decorator';
import {
  ClaimExpRequest,
  ExpServiceClient,
} from '@root/proto-interface/exp.proto.interface';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '@shared/logger';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { ClaimExpRequestDto } from '../dto/exp.dto';

@Injectable()
export class ExpService {
  private expService: ExpServiceClient;
  constructor(private appLogger: AppLogger) {
    const grpcClient = new GrpcClient<ExpServiceClient>({
      package: 'exp',
      protoPath: 'src/proto/exp.proto',
      url: '0.0.0.0:4004',
      serviceName: 'ExpService',
    });
    this.expService = grpcClient.getService();
  }

  async claimExp(context: AppContext, data: ClaimExpRequestDto): Promise<void> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam('ExpService')
      .addMsgParam('claimExp')
      .log('Will claim exp');

    const metaData = new Metadata();
    metaData.add('x-trace-id', context.traceId);
    if (!context.user || !context.user.userId) {
      this.appLogger.error('Invalid request');
      throw new Error('Invalid request');
    }
    const payload = {
      ...data,
      userId: context.user.userId,
    };
    try {
      await firstValueFrom(this.expService.claimExp(payload, metaData));
    } catch (error) {
      this.appLogger.error('Failed to claim exp');
      throw new Error('Failed to claim exp');
    }
    this.appLogger.log('Did claim exp');
  }
}
