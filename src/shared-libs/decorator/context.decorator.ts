import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Character } from '@root/proto-interface/auth.proto.interface';

export interface UserContext {
  userId: string;
  slugId: string;
  username: string;
  role: string;
  email: string;
  character: Character | undefined;
}
export interface AppContext {
  traceId: string;
  token: string;
  sessionId: string;
  refreshToken?: string;
  user: UserContext;
}

export interface WebsocketContext {
  user: UserContext;
  token: string;
}
export const Context = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AppContext => {
    const request = ctx.switchToHttp().getRequest();

    const token = request.get('Authorization');
    const traceId = request.get('x-trace-id');
    const sessionId = request.get('x-session-id');
    const refreshToken = request.get('RefreshToken');
    const user = request.user;
    return {
      traceId,
      token,
      sessionId,
      refreshToken,
      user,
    };
  },
);
