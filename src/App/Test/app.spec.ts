import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { SharedModule } from '@shared/SharedModule';
import { AppModule } from '@src/App/AppModule';
import { getTestAgent, TestAgentType } from '@src/Config/TestConfig';
import TestAgent from 'supertest/lib/agent';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('AppController (e2e)', () =>
{
  let app: NestFastifyApplication;
  let agent: TestAgent;
  let ds: DataSource;

  beforeAll(async() =>
  {
    const config: TestAgentType = await getTestAgent(SharedModule, AppModule);
    app = config.app;
    agent = config.agent;
    ds = config.ds;
  });

  afterAll(async() =>
  {
    if (app)
    {
      await app.close();
    }

    if (ds?.isInitialized)
    {
      await ds.destroy();
    }
  });

  test('/ (GET)', async() =>
  {
    const response = await agent.get('/');

    expect(response.statusCode).toEqual(200);
    expect(response.body.message).toEqual('Welcome to Nest Experience');
  });
});
