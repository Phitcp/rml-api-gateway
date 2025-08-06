import { AppContext } from '@shared/decorator/context.decorator';
import {
  GatewayCreateExpResourceDto,
  GatewayCreateExpResourceVO,
} from '../dto/exp.dto';
import { ExpServiceClient } from '@root/proto-interface/exp.proto.interface';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '@shared/logger';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';

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

  async createExpResource(
    context: AppContext,
    data: GatewayCreateExpResourceDto,
  ): Promise<GatewayCreateExpResourceVO> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam('ExpService')
      .addMsgParam('createExpResource')
      .log('Will create exp resource');

    const metaData = new Metadata();
    metaData.add('x-trace-id', context.traceId);
    const result = await firstValueFrom(
      this.expService.createExpResource(data, metaData),
    );
    this.appLogger.log('Did create exp resource');
    return result;
  }
}
