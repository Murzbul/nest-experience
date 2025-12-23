import SaveItemCommand from '@item/Application/Commands/SaveItemCommand';
import IItemDomain from '@item/Domain/Entities/IItemDomain';
import ItemRepPayload from '@item/Domain/Payloads/ItemRepPayload';
import { CommandBus } from '@nestjs/cqrs';
import { withUnitOfWork } from '@shared/Test/TestUtils';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';

export interface ItemTestData {
  item1: IItemDomain;
  item2: IItemDomain;
}

export class ItemTestHelper
{
  static async setupTestData(
    commandBus: CommandBus,
    clsService: ClsService,
    ds: DataSource
  ): Promise<ItemTestData>
  {
    let testData: ItemTestData;

    await withUnitOfWork(clsService, ds, async() =>
    {
      // Create first test item
      const item1Payload: ItemRepPayload = {
        number: 'INV-001',
        date: new Date(),
        customerName: 'John Doe',
        details: [
          {
            productName: 'Product A',
            quantity: 2,
            unitPrice: 50.00
          },
          {
            productName: 'Product B',
            quantity: 1,
            unitPrice: 30.00
          }
        ]
      };

      const item1 = await commandBus.execute(new SaveItemCommand(item1Payload));

      // Create a second test item
      const item2Payload: ItemRepPayload = {
        number: 'INV-002',
        date: new Date(),
        customerName: 'Jane Smith',
        details: [
          {
            productName: 'Product C',
            quantity: 3,
            unitPrice: 25.00,
            discountPercentage: 10
          }
        ]
      };

      const item2 = await commandBus.execute(new SaveItemCommand(item2Payload));

      testData = {
        item1,
        item2
      };
    });

    return testData;
  }

  static createTestPayload(overrides: Partial<ItemRepPayload> = {}): ItemRepPayload
  {
    return {
      number: `INV-${Date.now()}`,
      date: new Date(),
      customerName: 'Test Customer',
      details: [
        {
          productName: 'Test Product',
          quantity: 1,
          unitPrice: 100.00
        }
      ],
      ...overrides
    };
  }
}
