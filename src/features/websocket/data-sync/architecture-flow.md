// File: src/features/websocket/gateway/architecture-flow.md

# WebSocket Data Sync Architecture

## Flow Graph

```
Frontend (WebSocket)
    ↓
API Gateway (WebSocket Gateway)
    ↓
WebSocket Sync Service (Redis Cache)
    ↓
Other Microservices (gRPC, HTTP, etc.)
    ↓
Database

Frontend (HTTP)
    ↓
API Gateway (HTTP)
    ↓
Microservices (gRPC, HTTP)
    ↓
Database

Microservices → Publish events to Redis → WebSocket Sync Service → WebSocket Gateway → Frontend
```

## Description

- **Frontend**: Connects to the WebSocket Gateway for real-time data sync and notifications. Sends HTTP requests for business actions.
- **API Gateway (WebSocket Gateway)**: Handles WebSocket connections, authentication, and distributes sync messages to clients.
- **WebSocket Sync Service**: Fetches and caches user data, listens for events from microservices, and updates clients in real-time.
- **Microservices**: Perform business logic, update the database, and publish events to Redis for real-time sync.
- **Database**: Stores persistent data.

## EXP Update Flow

### Event Flow
1. **Frontend Action**:
   - User claims EXP → HTTP request sent to the server.

2. **Server Processing**:
   - Server calculates EXP → Updates database → Publishes `exp.claimed` event.

3. **Other Services React**:
   - Services listen to `exp.claimed` → Perform calculations → Update database → Publish `sync-data` event.

4. **WebSocket Sync**:
   - WebSocket Sync Service listens to `sync-data` → Sends updated data to the frontend.

### Implementation Notes

- WebSocket Gateway only handles data sync and notifications, not business logic.
- Microservices communicate with the gateway via Redis events for real-time updates.
- Frontend receives updates automatically via WebSocket, and can request fresh sync data.
- HTTP API remains the main entry point for business actions (create, update, delete, etc.).
- Redis is used for caching and event distribution.

## Example Features to Implement Later

- Real-time EXP updates
- Character status sync
- Achievement notifications
- Global announcements
- Online user tracking

---

**Documented for future implementation.**
