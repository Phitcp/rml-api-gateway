import { JwtConfigInterface } from './interfaces/jwt-config.interface';

export const jwtConfig = (): { jwt: JwtConfigInterface } => ({
  jwt: {
    jwtSecret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '5m',
  },
});
