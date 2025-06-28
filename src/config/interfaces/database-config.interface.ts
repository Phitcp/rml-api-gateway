// src/config/interfaces/database-config.interface.ts
export interface MongoConfig {
  type: 'mongo';
  uri: string;
  dbName: string;
}

export interface PostgresConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface MySQLConfig {
  type: 'mysql';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export type DatabaseConfig = MongoConfig | PostgresConfig | MySQLConfig;
