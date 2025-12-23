import { EntitySchema } from 'typeorm';

export class ItemDetailEntity
{
  id: string;
  itemHeaderId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ItemDetailSchema = new EntitySchema<ItemDetailEntity>({
  name: 'ItemDetailEntity',
  tableName: 'item_details',
  target: ItemDetailEntity,
  columns: {
    id: {
      type: 'uuid',
      primary: true
    },
    itemHeaderId: {
      name: 'item_header_id',
      type: 'uuid'
    },
    productName: {
      name: 'product_name',
      type: 'varchar',
      length: 255
    },
    quantity: {
      type: 'int'
    },
    unitPrice: {
      name: 'unit_price',
      type: 'decimal',
      precision: 10,
      scale: 2
    },
    subtotal: {
      type: 'decimal',
      precision: 10,
      scale: 2
    },
    discountPercentage: {
      name: 'discount_percentage',
      type: 'decimal',
      precision: 5,
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
  },
  indices: [
    {
      name: 'idx_item_detail_header',
      columns: ['itemHeaderId']
    }
  ]
});
