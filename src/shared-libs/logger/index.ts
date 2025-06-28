import { createLogger, transports, format, Logger } from 'winston';
import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import chalk, { ChalkInstance } from 'chalk';

const chalkLevelColor: Record<string, ChalkInstance> = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.green,
  debug: chalk.blue,
  verbose: chalk.cyan,
};

@Injectable()
export class AppLogger implements LoggerService {
  private logger: Logger;
  private context = '';
  constructor() {
    this.logger = createLogger({
      level: 'info',
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            format.printf(({ level, message, context, timestamp }) => {
              const contextToLog = chalk.yellow(context || 'No context');
              return `${chalkLevelColor[level](level.toUpperCase())} | ${timestamp as string} |  ${contextToLog} | ${message as string}`;
            }),
          ),
        }),
      ],
    });
  }
  addLogContext(context: string) {
    this.context = context;
    return this;
  }
  addMsgParam(param: string) {
    this.context = `${this.context} | ${param}`;
    return this;
  }
  log(message: string) {
    this.logger.info({ message, context: this.context });
  }
  error(message: string) {
    this.logger.error({ message, context: this.context });
  }
  warn(message: string) {
    this.logger.warn({ message, context: this.context });
  }
  debug?(message: string) {
    this.logger.debug({ message, context: this.context });
  }
  verbose?(message: string) {
    this.logger.verbose({ message, context: this.context });
  }
  fatal?(message: string) {
    this.logger.error({ message, context: this.context });
  }
  setLogLevels?(levels: LogLevel[]) {
    throw new Error(`Method not implemented. ${levels.join(',')}`);
  }
}
