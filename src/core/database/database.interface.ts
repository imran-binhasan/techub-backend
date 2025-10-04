export interface DatabaseConfig {
  type: 'mysql' | 'postgres' | 'mongodb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  autoLoadEntities: boolean;
  migrations: string[];
}
