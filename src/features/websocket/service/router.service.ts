import { AppContext } from '@shared/decorator/context.decorator';
import { AuthenticatedClient } from '../gateway/websocket.routing.gateway';
import { ChatWebsocketService } from '@feature/chat/service/chat.websocket.service';
import { DataSyncWebsocketService } from '@feature/data-sync/service/data-sync.websocket.service';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';

export interface WebsocketActionPayload {
  context: AppContext;
  payload: any;
  client: any;
  server: Server;
}

@Injectable()
export class EventRouterService {
  constructor(
    private chatWebsocketService: ChatWebsocketService,
    private DataSyncWebsocketService: DataSyncWebsocketService,
  ) {}

  serviceList = {
    chat: {
      name: 'ChatService',
      action: {
        joinRoom: (payload: WebsocketActionPayload) =>
          this.chatWebsocketService.joinRoom(
            payload.context,
            payload.client,
            payload.payload
          ),
        sendMessage: (payload: WebsocketActionPayload) =>
          this.chatWebsocketService.sendMessage(
            payload.context,
            payload.client,
            payload.payload,
          ),
      },
    },
    dataSync: {
      name: 'DataSyncWebsocketService',
      action: {
        joinRoom: (payload: WebsocketActionPayload) =>
          this.DataSyncWebsocketService.joinRoom(
            payload.context,
            payload.client,
          ),
      },
    },
  };

  routeEvent(
    service: string,
    action: string,
    payload: any,
    context: AppContext,
    client: AuthenticatedClient,
    server: Server
  ) {
    const serviceEntry = this.serviceList[service];
    if (!serviceEntry) {
      throw new Error(`Service ${service} not found`);
    }

    const actionEntry = serviceEntry.action[action];
    if (!actionEntry) {
      throw new Error(`Action ${action} not found in service ${service}`);
    }

    return actionEntry({ payload, context, client, server });
  }
}
