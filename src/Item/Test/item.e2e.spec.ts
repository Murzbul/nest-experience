import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { SharedModule } from '@shared/SharedModule';
import { getTestAgent, TestAgentType } from '@src/Config/TestConfig';
import ItemRepPayload from '@src/Item/Domain/Payloads/ItemRepPayload';
import { ItemModule } from '@src/Item/ItemModule';
import TestAgent from 'supertest/lib/agent';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('ItemModule - E2E Tests', () =>
{
  let app: NestFastifyApplication;
  let agent: TestAgent;
  let ds: DataSource;
  let config: TestAgentType;

  beforeAll(async() =>
  {
    config = await getTestAgent(SharedModule, ItemModule);
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

  describe('POST /api/items', () =>
  {
    test('should create item via HTTP endpoint', async() =>
    {
      const payload: ItemRepPayload = {
        number: 'INV-E2E-001',
        date: new Date('2024-01-15'),
        customerName: 'E2E Test Customer',
        details: [
          {
            productName: 'E2E Product A',
            quantity: 2,
            unitPrice: 50.00
          },
          {
            productName: 'E2E Product B',
            quantity: 1,
            unitPrice: 30.00
          }
        ]
      };

      const response = await agent
        .post('/api/items')
        .set('Accept', 'application/json')
        .send(payload);

      expect(response.statusCode).toStrictEqual(201);
      expect(response.body).toEqual({ message: 'Item created.' });
    });
  });

  describe('GET /api/items', () =>
  {
    test('should list items with pagination via HTTP endpoint', async() =>
    {
      const response = await agent.get('/api/items?pagination[offset]=0&pagination[limit]=5');

      const { body: { data, pagination } } = response;

      expect(response.statusCode).toEqual(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(pagination).toBeDefined();
      expect(pagination.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/items/:id', () =>
  {
    test('should retrieve specific item via HTTP endpoint', async() =>
    {
      // First, create an item to retrieve
      const createPayload: ItemRepPayload = {
        number: 'INV-E2E-002',
        date: new Date(),
        customerName: 'Retrieve Test Customer',
        details: [
          {
            productName: 'Product for Retrieval',
            quantity: 1,
            unitPrice: 100.00
          }
        ]
      };

      const createResponse = await agent
        .post('/api/items')
        .set('Accept', 'application/json')
        .send(createPayload);

      expect(createResponse.statusCode).toBe(201);

      // Get the list to find our item
      const listResponse = await agent.get('/api/items?pagination[offset]=0&pagination[limit]=100');
      const { body: { data } } = listResponse;
      const createdItem = data.find((item: any) => item.number === 'INV-E2E-002');

      expect(createdItem).toBeDefined();

      // Now retrieve the specific item
      const getResponse = await agent
        .get(`/api/items/${createdItem.id}`)
        .send();

      expect(getResponse.statusCode).toStrictEqual(200);
      expect(getResponse.body.number).toStrictEqual('INV-E2E-002');
      expect(getResponse.body.customerName).toStrictEqual('Retrieve Test Customer');
    });
  });
});
