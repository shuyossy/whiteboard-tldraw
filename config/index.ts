// src/config/index.ts
import config from 'config';
import { EnvConfig } from './types';

const whiteboardConfig: EnvConfig = {
  port: config.get<number>('port'),
  pg_host: config.get<string>('pg_host'),
  pg_port: config.get<number>('pg_port'),
  pg_user: config.get<string>('pg_user'),
  pg_password: config.get<string>('pg_password'),
  pg_database: config.get<string>('pg_database'),
  typeorm_synchronize: config.get<boolean>('typeorm_synchronize'),
};

export default whiteboardConfig;
