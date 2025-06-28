import { AppConfigInterface } from './interfaces/app-config.interface';

export const appConfig = (): { app: AppConfigInterface } => ({
  app: {
    TRACE_ID_HEADER: process.env.TRACE_ID_HEADER ?? 'x-trace-id',
    PORT: +(process.env.port ?? 3000),
  },
});
