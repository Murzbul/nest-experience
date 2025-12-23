import { DataSourceType } from '@config/constants';
import { defaultDataSourceOptions } from '@config/DataSource';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
class TypeormConfig implements TypeOrmOptionsFactory
{
  constructor(private readonly configService: ConfigService)
  {}

  async createTypeOrmOptions(connectionName: DataSourceType): Promise<TypeOrmModuleOptions>
  {
    switch (connectionName)
    {
      case DataSourceType.Default:
        return defaultDataSourceOptions(this.configService);
      default:
        return defaultDataSourceOptions(this.configService);
    }
  }
}

export default TypeormConfig;
