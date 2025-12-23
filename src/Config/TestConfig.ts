import { setupDataSource } from '@config/DataSourceTest';
import Compression from '@fastify/compress';
import FastifyMultipart from '@fastify/multipart';
import { RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModuleDefinition } from '@nestjs/core/interfaces/module-definition.interface';
import { CqrsModule } from '@nestjs/cqrs';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvConfig, EnvSchema } from '@src/Config/EnvConfig';
import Qs from 'fastify-qs';
import { ClsModule } from 'nestjs-cls';
import { agent as supertestAgent } from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { DataSource } from 'typeorm';

export type TestAgentType = { agent: TestAgent, app: NestFastifyApplication, ds: DataSource };

export async function getTestAgent(...modules: ModuleDefinition[]): Promise<TestAgentType>
{
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      await ConfigModule.forRoot({
        load: [EnvConfig],
        validationSchema: EnvSchema,
        isGlobal: true
      }),
      ClsModule.forRoot({
        global: true,
        middleware: { mount: true }
      }),
      CqrsModule.forRoot(),
      TypeOrmModule.forRootAsync({
        useFactory: async() =>
        {
          return {
            synchronize: false
          };
        },
        dataSourceFactory: async() =>
        {
          return await setupDataSource();
        },
        inject: []
      }),
      ...modules
    ]
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }]
  });

  const ds = app.get(DataSource);

  await app.register(Compression as any);
  await app.register(Qs as any);
  await app.register(FastifyMultipart as any);

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return {
    agent: supertestAgent(app.getHttpServer()),
    app,
    ds
  };
}
