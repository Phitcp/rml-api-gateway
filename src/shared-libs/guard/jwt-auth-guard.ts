/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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

      request['user'] = userDataToken;
      return true;
    } catch (_) {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }
  }
}
