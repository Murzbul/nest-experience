import { randomUUID } from 'crypto';

import RemoveItemCommand from '@item/Application/Commands/RemoveItemCommand';
import SaveItemCommand from '@item/Application/Commands/SaveItemCommand';
import UpdateItemCommand from '@item/Application/Commands/UpdateItemCommand';
import GetItemQuery from '@item/Application/Queries/GetItemQuery';
import ItemDetailRepPayload from '@item/Domain/Payloads/ItemDetailRepPayload';
import ItemRepPayload from '@item/Domain/Payloads/ItemRepPayload';
import ItemUpdatePayload from '@item/Domain/Payloads/ItemUpdatePayload';
import { ItemModule } from '@item/ItemModule';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { SharedModule } from '@shared/SharedModule';
import { withUnitOfWork } from '@shared/Test/TestUtils';
import { getTestAgent, TestAgentType } from '@src/Config/TestConfig';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { ItemTestHelper, ItemTestData } from './ItemTestHelper';

describe('ItemModule - Integration Tests', () =>
{
  let app: NestFastifyApplication;
  let ds: DataSource;
  let config: TestAgentType;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let clsService: ClsService;
  let testData: ItemTestData;

  beforeAll(async() =>
  {
    config = await getTestAgent(
      SharedModule,
      ItemModule
    );
    app = config.app;
    ds = config.ds;
    commandBus = app.get<CommandBus>(CommandBus);
    queryBus = app.get<QueryBus>(QueryBus);
    clsService = app.get<ClsService>(ClsService);

    // Setup test data
    testData = await ItemTestHelper.setupTestData(commandBus, clsService, ds);
  });

  afterAll(async() =>
  {
    if (ds?.isInitialized)
    {
      await ds.destroy();
    }
    await app?.close();
  });

  describe('SaveItemHandler', () =>
  {
    describe('Success Cases', () =>
    {
      test('should create item with all required fields', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const payload: ItemRepPayload = {
            number: 'INV-TEST-001',
            date: new Date('2024-02-01'),
            customerName: 'Test Customer',
            details: [
              {
                productName: 'Test Product',
                quantity: 5,
                unitPrice: 20.00
              }
            ]
          };

          const item = await commandBus.execute(new SaveItemCommand(payload));

          expect(item.number).toBe('INV-TEST-001');
          expect(item.customerName).toBe('Test Customer');
          expect(item.totalAmount).toBe(100.00); // 5 * 20
          expect(item.details).toHaveLength(1);
          expect(item.id).toBeDefined();
        });
      });

      test('should create item with multiple details', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const payload: ItemRepPayload = {
            number: 'INV-TEST-002',
            date: new Date('2024-02-02'),
            customerName: 'Multi Detail Customer',
            details: [
              {
                productName: 'Product 1',
                quantity: 2,
                unitPrice: 30.00
              },
              {
                productName: 'Product 2',
                quantity: 3,
                unitPrice: 15.00
              },
              {
                productName: 'Product 3',
                quantity: 1,
                unitPrice: 25.00
              }
            ]
          };

          const item = await commandBus.execute(new SaveItemCommand(payload));

          expect(item.details).toHaveLength(3);
          expect(item.totalAmount).toBe(130.00); // (2*30) + (3*15) + (1*25)
        });
      });

      test('should create item with discount', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const payload: ItemRepPayload = {
            number: 'INV-TEST-003',
            date: new Date('2024-02-03'),
            customerName: 'Discount Customer',
            details: [
              {
                productName: 'Discounted Product',
                quantity: 4,
                unitPrice: 50.00,
                discountPercentage: 20 // 20% discount
              }
            ]
          };

          const item = await commandBus.execute(new SaveItemCommand(payload));

          expect(item.totalAmount).toBe(160.00); // 4 * 50 - 20% = 160
          expect(item.details[0].discountPercentage).toBe(20);
        });
      });
    });

    describe('Failure Cases', () =>
    {
      test('should fail when creating item with invalid payload', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const invalidPayload = {
            number: 123, // Should be string
            date: '2024-02-01',
            customerName: 'Test',
            details: [] as ItemDetailRepPayload[]
          } as unknown as ItemRepPayload;

          await expect(
            commandBus.execute(new SaveItemCommand(invalidPayload))
          ).rejects.toThrow();
        });
      });

      test('should fail when creating item with duplicate number', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const payload: ItemRepPayload = {
            number: 'INV-001', // Already exists from test data
            date: new Date('2024-02-01'),
            customerName: 'Test Customer',
            details: [
              {
                productName: 'Test Product',
                quantity: 1,
                unitPrice: 10.00
              }
            ]
          };

          // Should fail due to unique constraint on number
          await expect(
            commandBus.execute(new SaveItemCommand(payload))
          ).rejects.toThrow();
        });
      });
    });
  });

  describe('GetItemHandler', () =>
  {
    describe('Success Cases', () =>
    {
      test('should retrieve item by ID', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const item = await queryBus.execute(new GetItemQuery({ id: testData.item1.id }));

          expect(item).toBeDefined();
          expect(item.id).toBe(testData.item1.id);
          expect(item.number).toBe('INV-001');
          expect(item.customerName).toBe('John Doe');
        });
      });

      test('should retrieve item with all details', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const item = await queryBus.execute(new GetItemQuery({ id: testData.item1.id }));

          expect(item.details).toHaveLength(2);
          expect(item.details[0].productName).toBe('Product A');
          expect(item.details[1].productName).toBe('Product B');
        });
      });
    });

    describe('Failure Cases', () =>
    {
      test('should fail when retrieving non-existent item', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const nonExistentId = randomUUID();

          await expect(
            queryBus.execute(new GetItemQuery({ id: nonExistentId }))
          ).rejects.toThrow();
        });
      });

      test('should fail when retrieving item with invalid ID format', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          await expect(
            queryBus.execute(new GetItemQuery({ id: 'invalid-id-format' }))
          ).rejects.toThrow();
        });
      });
    });
  });

  describe('UpdateItemHandler', () =>
  {
    describe('Success Cases', () =>
    {
      test('should update item customer name', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const updatePayload: ItemUpdatePayload = {
            id: testData.item1.id,
            number: testData.item1.number,
            date: testData.item1.date,
            customerName: 'Updated Customer Name',
            details: testData.item1.details.map(d => ({
              productName: d.productName,
              quantity: d.quantity,
              unitPrice: d.unitPrice,
              discountPercentage: d.discountPercentage
            }))
          };

          await commandBus.execute(new UpdateItemCommand(updatePayload));

          const updatedItem = await queryBus.execute(new GetItemQuery({ id: testData.item1.id }));
          expect(updatedItem.customerName).toBe('Updated Customer Name');
        });
      });

      test('should update item details', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const updatePayload: ItemUpdatePayload = {
            id: testData.item2.id,
            number: testData.item2.number,
            date: testData.item2.date,
            customerName: testData.item2.customerName,
            details: [
              {
                productName: 'Updated Product',
                quantity: 10,
                unitPrice: 15.00
              }
            ]
          };

          await commandBus.execute(new UpdateItemCommand(updatePayload));

          const updatedItem = await queryBus.execute(new GetItemQuery({ id: testData.item2.id }));
          expect(updatedItem.details).toHaveLength(1);
          expect(updatedItem.details[0].productName).toBe('Updated Product');
          expect(updatedItem.totalAmount).toBe(150.00); // 10 * 15
        });
      });
    });

    describe('Failure Cases', () =>
    {
      test('should fail when updating non-existent item', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const updatePayload: ItemUpdatePayload = {
            id: randomUUID(),
            number: 'INV-NONEXISTENT',
            date: new Date(),
            customerName: 'Test',
            details: []
          };

          await expect(
            commandBus.execute(new UpdateItemCommand(updatePayload))
          ).rejects.toThrow();
        });
      });

      test('should fail when updating item with invalid payload', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const invalidPayload = {
            id: testData.item1.id,
            number: 123, // Should be string
            date: '2024-02-01',
            customerName: 'Test',
            details: []
          } as any;

          await expect(
            commandBus.execute(new UpdateItemCommand(invalidPayload))
          ).rejects.toThrow();
        });
      });
    });
  });

  describe('RemoveItemHandler', () =>
  {
    describe('Success Cases', () =>
    {
      test('should remove item', async() =>
      {
        let itemId: string;

        // Create item
        await withUnitOfWork(clsService, ds, async() =>
        {
          const payload = ItemTestHelper.createTestPayload({ number: 'INV-TO-DELETE' });
          const item = await commandBus.execute(new SaveItemCommand(payload));
          itemId = item.id;
        });

        // Remove item
        await withUnitOfWork(clsService, ds, async() =>
        {
          await commandBus.execute(new RemoveItemCommand({ id: itemId }));
        });

        // Verify it's removed
        await withUnitOfWork(clsService, ds, async() =>
        {
          await expect(
            queryBus.execute(new GetItemQuery({ id: itemId }))
          ).rejects.toThrow();
        });
      });
    });

    describe('Failure Cases', () =>
    {
      test('should fail when removing non-existent item', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          const nonExistentId = randomUUID();

          await expect(
            commandBus.execute(new RemoveItemCommand({ id: nonExistentId }))
          ).rejects.toThrow();
        });
      });

      test('should fail when removing item with invalid ID', async() =>
      {
        await withUnitOfWork(clsService, ds, async() =>
        {
          await expect(
            commandBus.execute(new RemoveItemCommand({ id: 'invalid-id' }))
          ).rejects.toThrow();
        });
      });
    });
  });
});
