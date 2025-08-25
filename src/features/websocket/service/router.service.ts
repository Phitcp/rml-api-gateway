import { AppContext } from '@shared/decorator/context.decorator';
import { AuthenticatedClient } from '../gateway/websocket.routing.gateway';
import {
  ChatAuthenticatedSocket,
  ChatWebsocketService,
  ChatJoinRoomPayload,
  SocketSendMessagePayload,
} from '@feature/chat/service/chat.websocket.service';
import {
  DataSyncAuthenticatedSocket,
  DataSyncJoinRoomPayload,
  DataSyncWebsocketService,
} from '@feature/data-sync/service/data-sync.websocket.service';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';

export interface WebsocketActionPayload<K, T> {
  context: AppContext;
  payload: K;
  client: T;
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
        joinRoom: (
          payload: WebsocketActionPayload<
            ChatJoinRoomPayload,
            ChatAuthenticatedSocket
          >,
        ) =>
          this.chatWebsocketService.joinRoom(payload.client, payload.payload),
        sendMessage: (
          payload: WebsocketActionPayload<
            SocketSendMessagePayload,
            ChatAuthenticatedSocket
          >,
        ) =>
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
        joinRoom: (
          payload: WebsocketActionPayload<
            DataSyncJoinRoomPayload,
            DataSyncAuthenticatedSocket
          >,
        ) => this.DataSyncWebsocketService.joinRoom(payload.client),
      },
    },
  };

  routeEvent(
    service: string,
    action: string,
    payload: any,
    context: AppContext,
    client: AuthenticatedClient,
    server: Server,
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
