import { IdSchemaValidation } from '@shared/Validations/IdSchemaValidation';

import { ItemSchemaBase } from './ItemSchemaSaveValidation';

const ItemSchemaUpdateValidation = ItemSchemaBase.merge(IdSchemaValidation).refine(
  (data) =>
{
    // Business rule: Total amount should not exceed maximum limit
    const totalAmount = data.details.reduce(
      (sum, detail) => sum + (detail.quantity * detail.unitPrice),
      0
    );
    return totalAmount <= 10000000; // Max 10M total
  },
  {
    message: 'Total item amount exceeds maximum allowed (10,000,000)',
    path: ['details']
  }
).refine(
  (data) =>
{
    // Business rule: Item date cannot be in the future
    const itemDate = new Date(data.date);
    const now = new Date();
    return itemDate <= now;
  },
  {
    message: 'Item date cannot be in the future',
    path: ['date']
  }
);

export default ItemSchemaUpdateValidation;
