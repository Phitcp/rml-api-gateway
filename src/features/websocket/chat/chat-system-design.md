# Chat System Design Documentation

## Architecture Overview

This API Gateway provides **WebSocket and HTTP endpoints** for real-time chat functionality. All business logic and data persistence is handled by dedicated **Chat gRPC Microservice**.

### System Architecture
```
Frontend ↔ API Gateway (WebSocket/HTTP) ↔ Chat gRPC Microservice ↔ MongoDB + Redis
```

### Folder Structure
```
src/features/websocket/chat/
├── chat.gateway.ts               # Chat WebSocket gateway (message routing only)
├── chat-distributor.service.ts  # Routes requests to gRPC Chat Service
├── chat-sync.service.ts          # Handles real-time sync events from gRPC
├── interfaces/                   # TypeScript interfaces
│   ├── chat-message.interface.ts
│   ├── chat-room.interface.ts
│   └── message-status.enum.ts
└── dto/                          # Data Transfer Objects
    ├── send-message.dto.ts
    └── join-room.dto.ts
```

### Gateway Responsibilities
- **WebSocket connection management**
- **Authentication & authorization**
- **Message routing to gRPC service**
- **Real-time broadcasting to clients**
- **Event subscription from gRPC service**

### gRPC Service Responsibilities
- **Business logic implementation**
- **MongoDB sharding & data persistence**
- **Redis caching & message queuing**
- **Message delivery guarantees**
- **Room management & permissions**

## Core Features

### 1. API Gateway Functions
- **WebSocket Connection Management**: Handle client connections, authentication, room subscriptions
- **Message Routing**: Forward messages to Chat gRPC Service via gRPC calls
- **Real-time Broadcasting**: Receive events from gRPC service and broadcast to WebSocket clients
- **Authentication**: JWT validation for WebSocket connections
- **Rate Limiting**: Basic request throttling (detailed limits handled by gRPC service)

### 2. Chat gRPC Service Functions
- **Message Types**: 1-1 chat and group chat implementation
- **Message Delivery System**: SENT/DELIVERED/READ status tracking
- **MongoDB Sharding**: Time-based sharding by month
- **Redis Caching**: Message caching and offline message queues
- **Business Logic**: Room management, permissions, message validation

## Implementation Details

### WebSocket Gateway (`chat.gateway.ts`)
```typescript
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway {
  constructor(
    private chatDistributor: ChatDistributorService,
    private chatSync: ChatSyncService
  ) {}

  // Handle user authentication via JWT
  // Manage WebSocket room subscriptions  
  // Route all chat operations to gRPC Chat Service
  // Broadcast real-time updates from gRPC events
}
```

**Key Events:**
- `sendMessage` - Route to gRPC Chat Service
- `getHistory` - Route to gRPC Chat Service  
- `joinRoom` - Route to gRPC Chat Service
- `leaveRoom` - Route to gRPC Chat Service
- `messageDelivered` - Route delivery confirmation to gRPC
- `messageRead` - Route read receipt to gRPC
- `typing` - Route typing indicators to gRPC

### Chat Distributor Service (`chat-distributor.service.ts`)
```typescript
@Injectable()
export class ChatDistributorService {
  private chatServiceClient: ChatServiceClient;

  constructor() {
    this.chatServiceClient = new GrpcClient<ChatServiceClient>({
      package: 'chat',
      protoPath: 'src/proto/chat.proto',
      url: '0.0.0.0:4005',
      serviceName: 'ChatService',
    }).getService();
  }

  async sendMessage(userId: string, data: SendMessageDto) {
    const metadata = this.createMetadata(userId);
    
    const result = await firstValueFrom(
      this.chatServiceClient.sendMessage({
        senderId: userId,
        roomId: data.roomId,
        content: data.content,
        messageType: data.messageType || 'text'
      }, metadata)
    );

    return {
      success: true,
      data: result,
      timestamp: new Date(),
    };
  }

  async getMessageHistory(userId: string, data: GetHistoryDto) {
    const metadata = this.createMetadata(userId);
    
    const result = await firstValueFrom(
      this.chatServiceClient.getMessageHistory({
        userId,
        roomId: data.roomId,
        limit: data.limit || 50,
        fromDate: data.fromDate
      }, metadata)
    );

    return {
      success: true,
      data: result.messages,
      hasMore: result.hasMore,
      timestamp: new Date(),
    };
  }

  async joinRoom(userId: string, data: JoinRoomDto) {
    const metadata = this.createMetadata(userId);
    
    const result = await firstValueFrom(
      this.chatServiceClient.joinRoom({
        userId,
        roomId: data.roomId
      }, metadata)
    );

    return {
      success: true,
      data: result,
      timestamp: new Date(),
    };
  }

  private createMetadata(userId: string): Metadata {
    const metadata = new Metadata();
    metadata.add('user-id', userId);
    metadata.add('x-trace-id', `chat-${Date.now()}`);
    return metadata;
  }
}
```

**Key Methods:**
- `sendMessage(userId, data)` - Routes to gRPC Chat Service
- `getMessageHistory(userId, data)` - Routes to gRPC Chat Service
- `joinRoom(userId, data)` - Routes to gRPC Chat Service
- `leaveRoom(userId, data)` - Routes to gRPC Chat Service
- `markMessageDelivered(userId, data)` - Routes to gRPC Chat Service
- `markMessageRead(userId, data)` - Routes to gRPC Chat Service

### Chat Sync Service (`chat-sync.service.ts`)
```typescript
@Injectable()
export class ChatSyncService extends EventSubscriber {
  constructor(
    @Inject('REDIS_CLIENT') redis: Redis,
    appLogger: AppLogger,
    private chatGateway: ChatGateway
  ) {
    super(redis, appLogger);
  }

  protected getSubscriptions(): string[] {
    return [
      'chat:message:new',        // New message events from gRPC service
      'chat:message:delivered',  // Delivery confirmation events
      'chat:message:read',       // Read receipt events
      'chat:user:typing',        // Typing indicator events
      'chat:room:joined',        // User joined room events
      'chat:room:left',          // User left room events
    ];
  }

  protected async handleEvent(eventType: string, event: any): Promise<void> {
    switch (eventType) {
      case 'chat:message:new':
        await this.handleNewMessage(event);
        break;
      case 'chat:message:delivered':
        await this.handleMessageDelivered(event);
        break;
      case 'chat:message:read':
        await this.handleMessageRead(event);
        break;
      case 'chat:user:typing':
        await this.handleTyping(event);
        break;
      case 'chat:room:joined':
        await this.handleRoomJoined(event);
        break;
      case 'chat:room:left':
        await this.handleRoomLeft(event);
        break;
    }
  }

  private async handleNewMessage(event: any) {
    const { roomId, message, recipients } = event.data;
    
    // Broadcast to all room participants
    for (const userId of recipients) {
      this.chatGateway.broadcastToUser(userId, 'newMessage', message);
    }
  }

  private async handleMessageDelivered(event: any) {
    const { senderId, messageId, deliveredBy } = event.data;
    
    // Notify sender about delivery
    this.chatGateway.broadcastToUser(senderId, 'messageStatusUpdate', {
      messageId,
      status: 'delivered',
      userId: deliveredBy,
      timestamp: new Date()
    });
  }

  private async handleMessageRead(event: any) {
    const { senderId, messageId, readBy, readAt } = event.data;
    
    // Notify sender about read receipt
    this.chatGateway.broadcastToUser(senderId, 'messageStatusUpdate', {
      messageId,
      status: 'read',
      userId: readBy,
      readAt,
      timestamp: new Date()
    });
  }
}
```

### Connection Resilience (`chat-resilience.service.ts`)
```typescript
@Injectable()
export class ChatResilienceService {
  // Handle connection drops
  // Store offline messages
  // Sync missed messages on reconnect
  // Exponential backoff for reconnection
}
```

**Features:**
- Offline message queue (7-day expiry)
- Automatic reconnection with exponential backoff
- Missed message synchronization
- Connection health monitoring

### Pub/Sub Service (`chat-pubsub.service.ts`)
```typescript
@Injectable()
export class ChatPubSubService {
  // Redis pub/sub for multi-instance scaling
  // Cross-server message broadcasting
  // Event coordination between instances
}
```

## Data Models

### Message Interface
```typescript
interface ChatMessage {
  messageId: number;              // Local room sequence
  roomId: string;                 // Chat room identifier
  senderId: string;               // Message sender ID
  content: string;                // Message content
  timestamp: number;              // Unix timestamp
  monthYear: string;              // Format: "2025-08" for sharding
  status: MessageStatus;          // SENT/DELIVERED/READ
  deliveredTo: string[];          // List of users who received message
  readBy: {                       // Read receipts
    userId: string;
    readAt: number;
  }[];
  messageType: 'text' | 'image' | 'file'; // Message type
  metadata?: any;                 // Additional data (file info, etc.)
}
```

### Room Interface
```typescript
interface ChatRoom {
  roomId: string;                 // Unique room identifier
  roomType: '1v1' | 'group';      // Room type
  participants: string[];          // User IDs in the room
  createdAt: number;              // Creation timestamp
  lastMessageAt: number;          // Last activity timestamp
  metadata: {                     // Room settings
    name?: string;                // Group name
    description?: string;         // Group description
    avatar?: string;              // Group avatar URL
  };
}
```

### Message Status Enum
```typescript
enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}
```

## Redis Schema

### Message Storage
```
Key: chat:room:{roomId}:messages
Type: Sorted Set
Score: messageId
Value: JSON.stringify(ChatMessage)

Example:
ZADD chat:room:user1_user2:messages 1 '{"messageId":1,"content":"Hello",...}'
```

### Message ID Counter
```
Key: chat:room:{roomId}:msg_id
Type: String (Integer)
Value: Current message ID counter

Example:
INCR chat:room:user1_user2:msg_id  // Returns 1, 2, 3, ...
```

### Offline Messages
```
Key: offline:{userId}:messages
Type: List
Value: JSON.stringify(ChatMessage)

Example:
LPUSH offline:user123:messages '{"messageId":5,"content":"Missed message",...}'
```

### Room Management
```
Key: room:{roomId}:participants
Type: Set
Value: User IDs

Key: user:{userId}:rooms
Type: Set
Value: Room IDs
```

## Flow Diagrams

### Send Message Flow (Gateway → gRPC)
```
Frontend → WebSocket Gateway → Chat Distributor Service → gRPC Chat Service
                                                              ↓
                                               MongoDB + Redis (Business Logic)
                                                              ↓
                                          Publish Event to Redis Pub/Sub
                                                              ↓
                                      Chat Sync Service ← Redis Event
                                                              ↓
                                      WebSocket Gateway ← Broadcast Event
                                                              ↓
                                              Frontend ← Real-time Update
```

### Message History Flow (Gateway → gRPC)
```
Frontend → WebSocket Gateway → Chat Distributor Service → gRPC Chat Service
                                                              ↓
                                          Query MongoDB Shards (Month-based)
                                                              ↓
                                              Check Redis Cache
                                                              ↓
                                      Chat Distributor ← Return Messages
                                                              ↓
                                      WebSocket Gateway ← Response
                                                              ↓
                                              Frontend ← Message History
```

### Real-time Event Flow (gRPC → Gateway)
```
gRPC Chat Service → Business Logic → Update Database → Publish Redis Event
                                                              ↓
                              API Gateway Chat Sync Service ← Subscribe to Events
                                                              ↓
                                      WebSocket Gateway ← Event Notification
                                                              ↓
                                              Frontend ← Real-time Broadcast
```

## Scaling Considerations

### API Gateway Scaling
- **Multiple WebSocket Servers**: Use Redis pub/sub for cross-server communication
- **Load Balancer**: Use sticky sessions (ip_hash) for WebSocket connections
- **Stateless Design**: All state managed by gRPC Chat Service
- **Connection Pooling**: Reuse gRPC connections to Chat Service

### gRPC Chat Service Scaling (Handled by Chat Microservice)
- **MongoDB Sharding**: Time-based sharding by month
- **Redis Cluster**: Distributed caching and message queuing
- **Horizontal Pod Autoscaling**: Scale based on message throughput
- **Database Connection Pooling**: Efficient MongoDB connection management

### MongoDB Sharding Strategy (Implemented in gRPC Service)

#### Shard Key Design
```javascript
// Compound shard key: { monthYear: 1, roomId: 1 }
// This distributes messages across shards by month and ensures room locality
{
  _id: ObjectId(),
  messageId: Number,
  roomId: String,
  monthYear: String,        // "2025-08", "2025-09", etc. (SHARD KEY)
  senderId: String,
  content: String,
  timestamp: Date,
  // ... other fields
}
```

#### Collection Naming Strategy
```javascript
// Dynamic collection per month (handled by gRPC service)
messages_2025_08  // August 2025 messages
messages_2025_09  // September 2025 messages  
messages_2025_10  // October 2025 messages
```

### Performance Optimizations
- **gRPC Connection Pooling**: Reuse connections to Chat Service
- **Redis Connection Pooling**: Efficient Redis connections for pub/sub
- **Memory Management**: Limit WebSocket connection memory usage
- **Event Batching**: Group multiple events for broadcasting
- **Selective Broadcasting**: Only broadcast to relevant WebSocket connections

### Storage Tiering Strategy (Implemented in gRPC Service)
```
Tier 1 (Hot): Current month messages     → Fast SSD, high memory
Tier 2 (Warm): Last 3 months messages   → Standard SSD, medium memory  
Tier 3 (Cold): 3-12 months messages     → SATA drives, low memory
Tier 4 (Archive): 12+ months messages   → Cheap storage, compressed
```

### API Gateway Benefits
- **Simplified Logic**: Only handles routing and real-time broadcasting
- **Easy Scaling**: Stateless design allows horizontal scaling
- **Fault Tolerance**: If gateway goes down, gRPC service continues operating
- **Performance**: Minimal processing overhead in gateway layer

## Security Considerations

### Authentication
- JWT token validation for WebSocket connections
- User authorization for room access
- Rate limiting for message sending

### Data Privacy
- Message encryption in transit (WSS)
- Message encryption at rest (optional)
- User permission validation for room access

## Monitoring & Metrics

### Key Metrics to Track
- Messages per second per room
- Redis cache hit/miss rates
- WebSocket connection count
- Message delivery latency
- Offline message queue depth
- Database write batch sizes

### Health Checks
- Redis connection health
- WebSocket server status
- Database connectivity
- Message delivery rates

## Future Enhancements

### Phase 2 Features
- Message reactions/emojis
- Message threading/replies
- File attachments
- Voice messages
- Message search/indexing

### Phase 3 Features
- Message encryption (E2E)
- Message editing/deletion
- Advanced room permissions
- Bot integrations
- Analytics dashboard

### Implementation Priority

### High Priority (API Gateway MVP)
1. **WebSocket Gateway**: Basic connection management and authentication
2. **Chat Distributor Service**: Route messages to gRPC Chat Service
3. **Basic Events**: sendMessage, getHistory, joinRoom, leaveRoom
4. **Real-time Broadcasting**: Receive events from gRPC and broadcast to clients

### Medium Priority (API Gateway Enhancements)
1. **Chat Sync Service**: Subscribe to gRPC events via Redis pub/sub
2. **Connection Management**: Handle reconnections and room re-subscriptions
3. **Advanced Events**: messageDelivered, messageRead, typing indicators
4. **Error Handling**: Robust error handling for gRPC communication

### Low Priority (API Gateway Advanced Features)
1. **Performance Optimizations**: Connection pooling, event batching
2. **Monitoring**: WebSocket connection metrics and health checks
3. **Rate Limiting**: Basic request throttling at gateway level
4. **Load Testing**: Stress testing WebSocket connections

### gRPC Chat Service Implementation (Separate Service)
1. **MongoDB Sharding**: Time-based sharding by month
2. **Redis Caching**: Message caching and offline queues
3. **Business Logic**: Message delivery guarantees, room management
4. **Event Publishing**: Redis pub/sub for real-time notifications

---

**Note**: This design document focuses on the **API Gateway implementation** for chat functionality. The **gRPC Chat Microservice** handles all business logic, data persistence, and complex features like MongoDB sharding, message delivery guarantees, and offline message handling.

**API Gateway Role**: Simple message routing, WebSocket management, and real-time event broadcasting.  
**gRPC Service Role**: Complex business logic, data management, and system reliability.

**Created**: August 12, 2025  
**Version**: 2.0 (Gateway-focused)  
**Status**: Ready for Implementation
