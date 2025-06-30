/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { RBACServiceClient } from '@root/proto-interface/rbac.proto.interface';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';

export const RBAC_META_KEY = 'rbac_meta';
export interface RbacMeta {
  resource: string;
  action: string;
}

@Injectable()
export class RbacGuard implements CanActivate {
  private rbacClient: RBACServiceClient;
  constructor(
    private reflector: Reflector
  ) {
    const grpcClient = new GrpcClient<RBACServiceClient>({
      package: 'rbac',
      protoPath: 'src/proto/rbac.proto',
      url: '0.0.0.0:4002',
      serviceName: 'RBACService',
    });
    this.rbacClient = grpcClient.getService()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userData = request.user
    const {action, resource} = this.reflector.get<RbacMeta>(RBAC_META_KEY, context.getHandler())
    const metadata = new Metadata()
    metadata.add('x-trace-id', request.get('x-trace-id'))
    metadata.add('user', JSON.stringify(userData))

    const permissionCheck = await firstValueFrom(this.rbacClient.checkPermission({
      userId: userData.userId,
      resource,
      action
    }, metadata))
    return permissionCheck.allowed
  }
}

export const RbacMeta = (meta: RbacMeta) => SetMetadata(RBAC_META_KEY, meta);