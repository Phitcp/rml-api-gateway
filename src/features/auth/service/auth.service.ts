import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AppContext } from '@shared/decorator/context.decorator';
import { AppLogger } from '@root/shared-libs/logger';
import { basename } from 'path';
import { GrpcClient } from '@shared/utilities/grpc-client';
import {
  AuthServiceClient,
  GetUserFromSlugResponse,
  GetUserListFromSlugListResponse,
  GetUserTokensResponse,
  LoginResponse,
  RotateTokenResponse,
} from '@root/proto-interface/auth.proto.interface';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { GatewayRotateTokenRequestDto } from '../dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleDestroy {
  private grpcClient: GrpcClient<AuthServiceClient>;
  private authService: AuthServiceClient;
  
  constructor(private appLogger: AppLogger) {
    
    this.grpcClient = new GrpcClient<AuthServiceClient>({
      package: 'auth',
      protoPath: 'src/proto/auth.proto',
      url: '0.0.0.0:4001',
      serviceName: 'AuthService',
    });

    this.authService = this.grpcClient.getService();
    
    // Log initial connection status
    this.appLogger.log('AuthService gRPC client initialized with connection pooling');
  }

  async onModuleDestroy() {
    // Properly clean up gRPC connections
    await this.grpcClient.close();
    this.appLogger.log('AuthService gRPC connections closed');
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
    payload: GatewayRotateTokenRequestDto
  ): Promise<RotateTokenResponse> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('rotateToken');
    this.appLogger.log('Will rotateToken');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);

    const response = await firstValueFrom(
      this.authService.rotateToken({
        userId: context.user.userId,
        sessionId: context.sessionId,
        refreshToken: context.refreshToken ?? '',
      }, metadata),
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

  async getUserFromSlug(context: AppContext, slug: string): Promise<any> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('getUserFromSlug');
    
    this.appLogger.log('Will getUserFromSlug');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);
    
    try {
      const response = await firstValueFrom(
        this.authService.getUserFromSlug({ slugId: slug }, metadata),
      );
      this.appLogger.log('Did getUserFromSlug');
      return response;
    } catch (error) {
      this.appLogger.error(`Failed to getUserFromSlug for slug ${slug}: ${error.message}`);
      throw error;
    }
  }

  async logOut(context: AppContext) {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('logOut');
    this.appLogger.log('Will logOut');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);
    const response = await firstValueFrom(
      this.authService.logOut({
        userId: context.user.userId,
        sessionId: context.sessionId,
        accessToken: context.token.replace('Bearer ', ''),
      }, metadata),
    );
    this.appLogger.log('Did logOut');
    return response;
  }

  async getUserFromSlugByBulk(context: AppContext, slugs: string[]): Promise<GetUserListFromSlugListResponse> {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('getUserFromSlugByBulk');

    this.appLogger.log('Will getUserFromSlugByBulk');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);

    try {
      const response = await firstValueFrom(
        this.authService.getListUserInfoFromSlugs({ slugIds: slugs }, metadata),
      );
      this.appLogger.log('Did getUserFromSlugByBulk');
      return response
    } catch (error) {
      this.appLogger.error(`Failed to getUserFromSlugByBulk for slugs ${slugs.join(', ')}: ${error.message}`);
      throw error;
    }
  }
}
