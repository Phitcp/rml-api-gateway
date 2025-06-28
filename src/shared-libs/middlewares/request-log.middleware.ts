import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as idGen } from 'uuid';
import { AppLogger } from '../logger';
import { ConfigService } from '@nestjs/config';
import { AppConfigInterface } from '@root/config/interfaces/app-config.interface';

@Injectable()
export class RequestLogMiddleWare implements NestMiddleware {
  constructor(
    private appLogger: AppLogger,
    private configService: ConfigService,
  ) {}
  use(req: Request, _: Response, next: NextFunction) {
    const traceIdHeader =
      this.configService.get<AppConfigInterface>('app')?.TRACE_ID_HEADER ??
      'x-trace-id';
    if (!req[traceIdHeader]) {
      req.headers[traceIdHeader] = idGen();
    }

    const url = req.baseUrl;
    const method = req.method;
    const reqId = req.headers[traceIdHeader] as string;
    const reqBody = req.body;

    this.appLogger
      .addLogContext(reqId)
      .addMsgParam('Hit server')
      .log(
        `${method} | ${url} ${reqBody ? `| ${JSON.stringify(reqBody)}` : ''}`,
      );

    next();
  }
}
