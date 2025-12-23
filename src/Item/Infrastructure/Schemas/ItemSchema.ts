import { EntitySchema } from 'typeorm';

export class ItemEntity
{
  id: string;
  number: string;
  date: Date;
  customerName: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ItemSchema = new EntitySchema<ItemEntity>({
  name: 'ItemEntity',
  tableName: 'item_headers',
  target: ItemEntity,
  columns: {
    id: {
      type: 'uuid',
      primary: true
    },
    number: {
      type: 'varchar',
      length: 50,
      unique: true
    },
    date: {
      type: 'date'
    },
    customerName: {
      name: 'customer_name',
      type: 'varchar',
      length: 255
    },
    totalAmount: {
      name: 'total_amount',
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp',
      createDate: true
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamp',
      updateDate: true
    }
  }
});
