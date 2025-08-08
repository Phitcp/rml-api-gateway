import { Injectable } from '@nestjs/common';
import { AppContext } from '@shared/decorator/context.decorator';
import { AppLogger } from '@root/shared-libs/logger';
import { basename } from 'path';
import { GrpcClient } from '@shared/utilities/grpc-client';
import {
  AuthServiceClient,
  GetUserTokensResponse,
  LoginResponse,
  RotateTokenResponse,
} from '@root/proto-interface/auth.proto.interface';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js'; // Use require to avoid issues with Metadata not being recognized in the import statement
@Injectable()
export class AuthService {
  private authService: AuthServiceClient;
  constructor(private appLogger: AppLogger) {
    const grpcClient = new GrpcClient<AuthServiceClient>({
      package: 'auth',
      protoPath: 'src/proto/auth.proto',
      url: '0.0.0.0:4001',
      serviceName: 'AuthService',
    });

    this.authService = grpcClient.getService();
  }

  async login(context: AppContext, data: any): Promise<LoginResponse> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('login');
    this.appLogger.log('Will login');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);

    const response = await firstValueFrom(
      this.authService.login(data, metadata),
    );
    this.appLogger.log('Did login');
    return response;
  }

  async rotateToken(
    context: AppContext,
    data: any,
  ): Promise<RotateTokenResponse> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('rotateToken');
    console.log(data);
    this.appLogger.log('Will rotateToken');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);

    const response = await firstValueFrom(
      this.authService.rotateToken(data, metadata),
    );
    this.appLogger.log('Did rotateToken');
    return response;
  }

  async getTokenForUser(
    context: AppContext,
    data: any,
  ): Promise<GetUserTokensResponse> {
    try {
      this.appLogger
        .addLogContext(context.traceId)
        .addMsgParam(basename(__filename))
        .addMsgParam('getTokenForUser');
      console.log(data);
      this.appLogger.log('Will getTokenForUser');
      const metadata = new Metadata();
      metadata.add('x-trace-id', context.traceId);
      metadata.add('user', JSON.stringify(context.user));
      const response = await firstValueFrom(
        this.authService.getUserTokens(data, metadata),
      );
      this.appLogger.log('Did getTokenForUser');
      return response;
    } catch (error) {
      this.appLogger.error('Failed to getTokenForUser');
      throw error;
    }
  }

  async registerOtp(context: AppContext, data: any): Promise<any> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('registerOtp');
    this.appLogger.log('Will registerOtp');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);
    const response = await firstValueFrom(
      this.authService.registerOtp(data, metadata),
    );
    this.appLogger.log('Did registerOtp');
    return response;
  }

  async verifyRegisterOtp(context: AppContext, data: any): Promise<any> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('verifyRegisterOtp');
    this.appLogger.log('Will verifyRegisterOtp');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);
    const response = await firstValueFrom(
      this.authService.verifyRegisterOtp(data, metadata),
    );
    this.appLogger.log('Did verifyRegisterOtp');
    return response;
  }
}
