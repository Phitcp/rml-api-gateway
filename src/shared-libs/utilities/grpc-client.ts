import {
  GrpcOptions,
  ClientGrpcProxy,
  ClientGrpc,
} from '@nestjs/microservices';

export interface GrpcClientInput {
  package: string;
  protoPath: string;
  url: string;
  serviceName: string;
}
export class GrpcClient<T> {
  private client: ClientGrpc;

  constructor(private input: GrpcClientInput) {
    const options: Required<GrpcOptions>['options'] = {
      package: input.package,
      protoPath: input.protoPath,
      url: input.url,
    };

    this.client = new ClientGrpcProxy(options);
  }

  getService(): T {
    return this.client.getService(this.input.serviceName) as T
  }
}
