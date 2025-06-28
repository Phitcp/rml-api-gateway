import { RBACServiceClient } from '@root/proto-interface/rbac.proto.interface';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { AppLogger } from '@shared/logger';
import { firstValueFrom } from 'rxjs';

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
      const result = await firstValueFrom(
        this.rbacService.checkPermission({
          userId: '123',
        }),
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
  async hasRole() {
    return true;
  }
  async getUserRoles() {
    return true;
  }
}
