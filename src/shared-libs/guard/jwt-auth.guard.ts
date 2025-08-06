/* eslint-disable @typescript-eslint/no-unused-vars */
import { Metadata } from '@grpc/grpc-js';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthServiceClient } from '@root/proto-interface/auth.proto.interface';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JwtGuard implements CanActivate {
  private authService: AuthServiceClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
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

    const authHeader = request.get('Authorization') as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Invalid header', HttpStatus.FORBIDDEN);
    }
    const token = authHeader.split('Bearer ')[1];

    try {
      const userDataToken = this.jwtService.verify(token, {
        secret: this.configService.get('jwt').jwtSecret,
      });

      if (!userDataToken.slugId) {
        throw new HttpException('Invalid request', HttpStatus.FORBIDDEN);
      }

      const metadata = new Metadata();
      metadata.add('x-trace-id', request.get('x-trace-id'));
      const user = await firstValueFrom(
        this.authService.getUserFromSlug(
          {
            slugId: userDataToken.slugId,
          },
          metadata,
        ),
      );
      request['user'] = { ...userDataToken, ...user };

      return true;
    } catch (_) {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }
  }
}
