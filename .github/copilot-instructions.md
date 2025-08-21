# RML API Gateway - AI Development Guide

## Architecture Overview

This is a **NestJS-based API Gateway** that acts as a gRPC-to-HTTP proxy for microservices, with WebSocket support for real-time features. The gateway is stateless - all business logic resides in dedicated gRPC microservices.

### Core Architecture Pattern
```
Frontend ↔ API Gateway (HTTP/WebSocket) ↔ gRPC Microservices ↔ Database
```

## Essential Patterns

### 1. gRPC Client Pattern
All microservice communication uses the `GrpcClient` utility:

```typescript
// src/shared-libs/utilities/grpc-client.ts
const grpcClient = new GrpcClient<AuthServiceClient>({
  package: 'auth',
  protoPath: 'src/proto/auth.proto',
  url: '0.0.0.0:4001', 
  serviceName: 'AuthService',
});
this.authService = grpcClient.getService();
```

**Key convention**: Each service has its own port (auth:4001, character:4002, chat:4005, etc.)

### 2. Context Pattern for Request Tracing
Use the `@Context()` decorator for consistent request context across all endpoints:

```typescript
// src/shared-libs/decorator/context.decorator.ts
async someMethod(@Context() context: AppContext) {
  const metadata = new Metadata();
  metadata.add('x-trace-id', context.traceId);
  metadata.add('user-id', context.user.userId);
  // Pass to gRPC calls
}
```

**Required**: Every gRPC call must include trace-id and user context in metadata.

### 3. Proto Interface Generation
- Proto files in `src/proto/` define gRPC contracts
- Interfaces auto-generated in `src/proto-interface/` 
- **Never edit interface files manually** - they're code-generated

### 4. WebSocket Gateway Pattern
WebSocket gateways follow a specific pattern:

```typescript
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/specific-namespace',
})
export class FeatureGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // JWT authentication in handleConnection
  // Redis for user session management
  // Broadcast only, no business logic
}
```

### 5. Redis Integration
- User sessions: `UserInfo_Prefix + slugId`
- Connection tracking: `ConnectedUserWs_Prefix + userId`  
- Chat rooms: `chatRoomPrefix + roomId`
- **Pattern**: Always use Redis for WebSocket state management

## Feature Module Structure

Each feature follows this structure:
```
features/feature-name/
├── feature.module.ts
├── controller/
│   └── feature.controller.ts
├── service/
│   └── feature.service.ts  
├── dto/
│   └── feature.dto.ts
└── websocket/ (if needed)
    └── feature.websocket.gateway.ts
```

## Development Workflows

### Adding New Features
1. Create proto file in `src/proto/`
2. Generate interfaces: `npx protoc --ts_proto_out=src/proto-interface --ts_proto_opt=nestJs=true -I ./src/proto ./src/proto/new-feature.proto`
3. Create feature module following existing patterns
4. Add gRPC client in service layer
5. Add WebSocket gateway if real-time features needed

### Testing WebSocket Features
Use the test files in root directory:
- `test-chat-2-end.html` - Chat system testing
- `chat-session.html` - Basic WebSocket testing

### Running the Application
```bash
npm run start:dev  # Development with hot reload
npm run start:prod # Production mode
```

## Critical Integration Points

### JWT & Authentication
- JWT validation in WebSocket connections via `JwtService`
- User context extraction from tokens for gRPC metadata
- Session management via Redis with TTL

### Redis Pub/Sub for Real-time
- Microservices publish events to Redis
- WebSocket gateways subscribe to relevant events
- Pattern: `eventType:entityId` (e.g., `chat:message:new`)

### Error Handling
- Global exception filter in `src/shared-libs/exception-filter/`
- Structured logging with `AppLogger` 
- Request tracing via middleware in `src/shared-libs/middlewares/`

## Project-Specific Conventions

### Import Path Aliases
```typescript
@root/ -> src/
@shared/ -> src/shared-libs/
@feature/ -> src/features/
```

### gRPC Metadata Pattern
Always include these in gRPC calls:
- `x-trace-id`: For request tracing
- `user-id`: Current user identifier
- Custom headers as needed per service

### WebSocket Event Naming
- Client → Server: camelCase (`sendMessage`, `joinRoom`)
- Server → Client: camelCase (`receiveMessage`, `messageStatus`)
- Internal events: kebab-case with colons (`chat:message:new`)

## Common Pitfalls to Avoid

1. **Don't put business logic in the gateway** - Always delegate to gRPC services
2. **Don't forget metadata in gRPC calls** - Tracing and user context required
3. **Use Redis for WebSocket state** - Don't store state in gateway memory
4. **Handle WebSocket authentication properly** - Validate JWT in `handleConnection`
5. **Broadcast only relevant users** - Don't broadcast to all connected clients

## Service URLs & Ports
- Auth Service: `0.0.0.0:4001`
- Character Service: `0.0.0.0:4002` 
- Chat Service: `0.0.0.0:4005`
- EXP Service: (see existing code for port)

When adding new services, follow the port increment pattern and update all relevant configurations.
