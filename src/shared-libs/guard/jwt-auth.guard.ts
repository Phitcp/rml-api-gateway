/* eslint-disable @typescript-eslint/no-unused-vars */
import { Metadata } from '@grpc/grpc-js';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AuthServiceClient,
  GetUserFromSlugResponse,
} from '@root/proto-interface/auth.proto.interface';
import { RedisService } from '@root/redis/redis.service';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { firstValueFrom } from 'rxjs';
import {
  BlackListedAccessToken_Prefix,
  UserInfo_Prefix,
} from '@root/redis/constant';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const ROTATE_TOKEN_META_KEY = 'ROTATE_TOKEN_META_KEY';

export interface RotateTokenMeta {
  isRotateToken?: boolean;
}

export const RotateTokenMeta = (meta: RotateTokenMeta) =>
  SetMetadata(ROTATE_TOKEN_META_KEY, meta);

@Injectable()
export class JwtGuard implements CanActivate {
  private authService: AuthServiceClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private reflector: Reflector,
  ) {
    const grpcClient = new GrpcClient<AuthServiceClient>({
      package: 'auth',
      protoPath: 'src/proto/auth.proto',
      url: '0.0.0.0:4001',
      serviceName: 'AuthService',
    });
    this.authService = grpcClient.getService();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const tokenReflector = this.reflector.get<RotateTokenMeta>(
      ROTATE_TOKEN_META_KEY,
      context.getHandler(),
    );
    const { isRotateToken } = tokenReflector || {};
    if (!isRotateToken) {
      return await this.handleAccessToken(request);
    }
    return await this.handleRefreshToken(request);
  }

  private async handleRefreshToken(request: Request): Promise<boolean> {
    const metadata = new Metadata();
    metadata.add('x-trace-id', request.get('x-trace-id') as string);
    const user = await firstValueFrom(
      this.authService.getUserFromSlug(
        {
          slugId: request.body.userId,
        },
        metadata,
      ),
    );
    request['user'] = user;
    return true;
  }

  private async handleAccessToken(request: Request) {
    const authHeader = request.get('Authorization') as string;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Invalid header', HttpStatus.FORBIDDEN);
    }
    const token = authHeader.split('Bearer ')[1];

    if (token) {
      const blacklistedToken = await this.redisService.get(
        `${BlackListedAccessToken_Prefix}${token}`,
      );
      if (blacklistedToken) {
        throw new HttpException('Authentication error', HttpStatus.FORBIDDEN);
      }
    }
    try {
      const userDataToken = this.jwtService.verify(token, {
        secret: this.configService.get('jwt').jwtSecret,
      });

      if (!userDataToken.slugId) {
        throw new HttpException('Invalid request', HttpStatus.FORBIDDEN);
      }
      const redisKey = `${UserInfo_Prefix}${userDataToken.slugId}`;

      const user = await this.redisService.getOrSet(
        redisKey,
        () =>
          this.getUserData(
            request.get('x-trace-id') as string,
            userDataToken.slugId,
          ),
        3600 * 1000,
      );
      request['user'] = user;

      return true;
    } catch (_) {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }
  }

  private async getUserData(
    traceId: string,
    slugId: string,
  ): Promise<GetUserFromSlugResponse> {
    const metadata = new Metadata();
    metadata.add('x-trace-id', traceId);
    return await firstValueFrom(
      this.authService.getUserFromSlug(
        {
          slugId: slugId,
        },
        metadata,
      ),
    );
  }
}
