import {
  GrpcOptions,
  ClientGrpcProxy,
  ClientGrpc,
} from '@nestjs/microservices';
import { OnModuleDestroy } from '@nestjs/common';

export interface GrpcClientInput {
  package: string;
  protoPath: string;
  url: string;
  serviceName: string;
  // gRPC connection optimization options
  maxReceiveMessageLength?: number;
  maxSendMessageLength?: number;
  keepaliveTimeMs?: number;
  keepaliveTimeoutMs?: number;
  keepalivePermitWithoutCalls?: boolean;
  maxConnectionIdle?: number;
  maxConnectionAge?: number;
}

export class GrpcClient<T> implements OnModuleDestroy {
  private client: ClientGrpc;
  private static connectionPool = new Map<string, ClientGrpc>();
  private connectionKey: string;

  constructor(private input: GrpcClientInput) {
    this.connectionKey = `${input.package}-${input.url}`;
    
    if (GrpcClient.connectionPool.has(this.connectionKey)) {
      this.client = GrpcClient.connectionPool.get(this.connectionKey)!;
    } else {
      const options: Required<GrpcOptions>['options'] = {
        package: input.package,
        protoPath: input.protoPath,
        url: input.url,
        channelOptions: {
          'grpc.keepalive_time_ms': input.keepaliveTimeMs || 30000, // 30 seconds
          'grpc.keepalive_timeout_ms': input.keepaliveTimeoutMs || 5000, // 5 seconds
          'grpc.keepalive_permit_without_calls': input.keepalivePermitWithoutCalls ?? true,
          
          // Ping settings to detect dead connections
          'grpc.http2.max_pings_without_data': 0,
          'grpc.http2.min_time_between_pings_ms': 10000, // 10 seconds
          'grpc.http2.min_ping_interval_without_data_ms': 300000, // 5 minutes
          
          // Connection management
          'grpc.max_connection_idle_ms': input.maxConnectionIdle || 60000, // 1 minute
          'grpc.max_connection_age_ms': input.maxConnectionAge || 300000, // 5 minutes
          'grpc.max_connection_age_grace_ms': 30000, // 30 seconds
          
          // Message size limits
          'grpc.max_receive_message_length': input.maxReceiveMessageLength || 4194304, // 4MB
          'grpc.max_send_message_length': input.maxSendMessageLength || 4194304, // 4MB
          
          // Connection pooling
          'grpc.use_local_subchannel_pool': 1,
          'grpc.max_connection_attempts': 5,
          'grpc.initial_reconnect_backoff_ms': 1000,
          'grpc.max_reconnect_backoff_ms': 30000,
        },
      };

      this.client = new ClientGrpcProxy(options);
      GrpcClient.connectionPool.set(this.connectionKey, this.client);
    }
  }

  getService(): T {
    return this.client.getService(this.input.serviceName) as T;
  }

  // Close this specific client connection
  async close(): Promise<void> {
    try {
      // Remove from pool and close if possible
      const client = GrpcClient.connectionPool.get(this.connectionKey);
      if (client && typeof (client as any).close === 'function') {
        await (client as any).close();
      }
      GrpcClient.connectionPool.delete(this.connectionKey);
      
      console.log(`Closed gRPC connection for ${this.connectionKey}`);
    } catch (error) {
      console.warn(`Failed to close gRPC connection for ${this.connectionKey}:`, error);
    }
  }

  // Cleanup connections when service is destroyed
  async onModuleDestroy() {
    // Individual clients don't close connections since they're pooled
    // The connection pool is cleaned up when the last client is destroyed
  }

  // Static method to clean up all pooled connections
  static async closeAllConnections() {
    // Close all pooled connections
    for (const [key, client] of GrpcClient.connectionPool.entries()) {
      try {
        // Close the connection if the client has a close method
        if (typeof (client as any).close === 'function') {
          await (client as any).close();
        }
      } catch (error) {
        console.warn(`Failed to close gRPC connection for ${key}:`, error);
      }
    }
    GrpcClient.connectionPool.clear();
  }
}
