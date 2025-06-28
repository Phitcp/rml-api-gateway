import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AppLogger } from '@shared/logger';
import { Request, Response } from 'express';
import { status } from '@grpc/grpc-js';
@Injectable()
export class ExceptionHandler implements ExceptionFilter {
  constructor(private logger: AppLogger) {}
  private handleGrpcException(exception: any, req: Request, res: Response) {
    this.logger.error('GRPC Error');
    const metadata = exception.metadata.getMap()

    const message = exception.details ?? 'Unhandled Error';
    const status = this.grpcStatusToHttpStatus(exception.code);

    const errorObject = {
      method: req.method,
      path: req.url,
      status,
      message,
    };

    res.status(status).json({
      timestamp: new Date().toISOString(),
      status: errorObject.status,
      message: errorObject.message,
    });
    if (!(exception instanceof HttpException)) {
      this.logger.error(JSON.stringify(errorObject));
    }
  }
  private handleHttpException(exception: any, req: Request, res: Response) {
    this.logger.error('HTTP Error');
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Unhandled Error';

    const errorObject = {
      method: req.method,
      path: req.url,
      status,
      message,
    };

    res.status(status).json({
      timestamp: new Date().toISOString(),
      status: errorObject.status,
      message: errorObject.message,
    });
    if (!(exception instanceof HttpException)) {
      this.logger.error(JSON.stringify(errorObject));
    }
  }
  catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const req = context.getRequest<Request>();
    const res = context.getResponse<Response>();

    if (exception.metadata) {
      // Handle gRPC exception
      this.handleGrpcException(exception, req, res);
    } else {
      // Handle HTTP exception
      this.handleHttpException(exception, req, res);
    }
  }

  private grpcStatusToHttpStatus(code: number): HttpStatus {
    switch (code) {
      case status.OK:
        return HttpStatus.OK;
      case status.CANCELLED:
        return HttpStatus.BAD_REQUEST;
      case status.UNKNOWN:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case status.INVALID_ARGUMENT:
        return HttpStatus.BAD_REQUEST;
      case status.DEADLINE_EXCEEDED:
        return HttpStatus.REQUEST_TIMEOUT;
      case status.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case status.ALREADY_EXISTS:
        return HttpStatus.CONFLICT;
      case status.PERMISSION_DENIED:
        return HttpStatus.FORBIDDEN;
      case status.UNAUTHENTICATED:
        return HttpStatus.UNAUTHORIZED;
      case status.RESOURCE_EXHAUSTED:
        return HttpStatus.TOO_MANY_REQUESTS;
      case status.FAILED_PRECONDITION:
        return HttpStatus.PRECONDITION_FAILED;
      case status.ABORTED:
        return HttpStatus.CONFLICT;
      case status.OUT_OF_RANGE:
        return HttpStatus.BAD_REQUEST;
      case status.UNIMPLEMENTED:
        return HttpStatus.NOT_IMPLEMENTED;
      case status.INTERNAL:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case status.UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE;
      case status.DATA_LOSS:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
