import {
  CreateResourcesRequest,
  GrantAccessToRoleRequest,
  RBACServiceClient,
} from '@root/proto-interface/rbac.proto.interface';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { AppLogger } from '@shared/logger';
import { firstValueFrom } from 'rxjs';
import { AppContext } from '@shared/decorator/context.decorator';
import { CreateRolesRequestDto } from '../dto/rbac.dto';
import { basename } from 'path';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class RbacService {
  private rbacService: RBACServiceClient;
  constructor(private appLogger: AppLogger) {
    const grpcClient = new GrpcClient<RBACServiceClient>({
      package: 'rbac',
      protoPath: 'src/proto/rbac.proto',
      url: '0.0.0.0:4002',
      serviceName: 'RBACService',
    });

    this.rbacService = grpcClient.getService();
  }
  async checkPermission() {
    try {
      this.appLogger
        .addMsgParam(basename(__filename))
        .addMsgParam('checkPermission')
        .log(`Will check permission`);

      const metadata = new Metadata();
      metadata.add('x-trace-id', '123');
      const result = await firstValueFrom(
        this.rbacService.checkPermission(
          {
            userId: '123',
            resource: 'abc',
            action: 'abc'
          },
          metadata,
        ),
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
  async hasRole() {
    return true;
  }

  async getUserPermissions() {
    return true;
  }

  async createRole(context: AppContext, createRoleDto: CreateRolesRequestDto) {
    try {
      this.appLogger
        .addLogContext(context.traceId)
        .addMsgParam(basename(__filename))
        .addMsgParam('createRole')
        .log(`Will create role`);

      const metadata = new Metadata();
      metadata.add('x-trace-id', context.traceId);

      const result = await firstValueFrom(
        this.rbacService.createRole(
          {
            role: createRoleDto.role,
            slug: createRoleDto.slug,
            description: createRoleDto.description,
          },
          metadata,
        ),
      );

      this.appLogger.log('Did create role successfully');
      return result;
    } catch (error) {
      this.appLogger.error(
        `Failed to create role: ${JSON.stringify(createRoleDto)}`,
      );
      throw error;
    }
  }

  async createResource(
    context: AppContext,
    createResourceDto: CreateResourcesRequest,
  ) {
    try {
      this.appLogger
        .addLogContext(context.traceId)
        .addMsgParam(basename(__filename))
        .addMsgParam('createResource')
        .log(`Will create resource`);

      const metadata = new Metadata();
      metadata.add('x-trace-id', context.traceId);
      const result = await firstValueFrom(
        this.rbacService.createResource(
          {
            name: createResourceDto.name,
            description: createResourceDto.description,
            slug: createResourceDto.slug,
          },
          metadata,
        ),
      );

      this.appLogger.log('Did create resource successfully');
      return result;
    } catch (error) {
      this.appLogger.error(
        `Failed to create resource: ${JSON.stringify(createResourceDto)}`,
      );
      throw error;
    }
  }

  async grantAccess(
    context: AppContext,
    grantAccessDto: GrantAccessToRoleRequest,
  ) {
    try {
      this.appLogger
        .addLogContext(context.traceId)
        .addMsgParam(basename(__filename))
        .addMsgParam('grantAccess')
        .log(`Will grant access to role`);

      const metadata = new Metadata();
      metadata.add('x-trace-id', context.traceId);
      const result = await firstValueFrom(
        this.rbacService.grantAccessToRole(
          {
            role: grantAccessDto.role,
            resource: grantAccessDto.resource,
            actions: grantAccessDto.actions,
          },
          metadata,
        ),
      );

      this.appLogger.log('Did grant access successfully');
      return result;
    } catch (error) {
      this.appLogger.error(`Failed to grant access`);
      throw error;
    }
  }
  async updateGrantForRole(context: AppContext, updateGrantDto: any) {
    try {
      this.appLogger
        .addLogContext(context.traceId)
        .addMsgParam(basename(__filename))
        .addMsgParam('updateGrantForRole')
        .log(`Will update grant for role`);

      const metadata = new Metadata();
      metadata.add('x-trace-id', context.traceId);
      const result = await firstValueFrom(
        this.rbacService.updateGrantForRole(updateGrantDto, metadata),
      );

      this.appLogger.log('Did update grant for role successfully');
      return result;
    } catch (error) {
      this.appLogger.error(`Failed to update grant for role`);
      throw error;
    }
  }
  async deleteGrantForRole(context: AppContext, deleteGrantDto: any) {
    try {
      this.appLogger
        .addLogContext(context.traceId)
        .addMsgParam(basename(__filename))
        .addMsgParam('deleteGrantForRole')
        .log(`Will delete grant for role`);

      const metadata = new Metadata();
      metadata.add('x-trace-id', context.traceId);
      const result = await firstValueFrom(
        this.rbacService.deleteGrantForRole(deleteGrantDto, metadata),
      );

      this.appLogger.log('Did delete grant for role successfully');
      return result;
    } catch (error) {
      this.appLogger.error(`Failed to delete grant for role`);
      throw error;
    }
  }

  async getUserPermission(context: AppContext, userId: string) {
    this.appLogger
      .addLogContext(context.traceId)
      .addMsgParam(basename(__filename))
      .addMsgParam('getUserPermission')
      .log(`Will get permissions for user`);

    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);
    const result = await firstValueFrom(
      this.rbacService.getUserPermissions({ userId }, metadata),
    );

    this.appLogger.log('Did get permissions for user');
    return result;
  }
}
