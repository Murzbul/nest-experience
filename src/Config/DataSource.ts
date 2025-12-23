import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export const defaultDataSourceOptions = (configService: ConfigService): DataSourceOptions =>
{
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
    entities: ['dist/**/Infrastructure/Schemas/*Schema.js'],
    synchronize: true, // Set to false in production
    logging: false,
    poolSize: 30,
    extra: {
      max: 30
    }
  };
};
