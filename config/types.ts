// src/config/types.ts
export interface EnvConfig {
    port: number;
    host: string;
    pg_host: string;
    pg_port: number;
    pg_user: string;
    pg_password: string;
    pg_database: string;
    typeorm_synchronize: boolean;
    drawio_url: string;
    node_env: 'development' | 'production' | 'test';
  }
  