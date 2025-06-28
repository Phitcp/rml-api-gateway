import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  userId: string;
}
export interface AppContext {
  traceId: string;
  token: string;
  user?: UserContext;
}

export const Context = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AppContext => {
    const request = ctx.switchToHttp().getRequest();

    const token = request.get('Authorization');
    const traceId = request.get('x-trace-id');
    const user = request.user;
    return {
      traceId,
      token,
      user: user ? { userId: user.userId } : undefined,
    };
  },
);
