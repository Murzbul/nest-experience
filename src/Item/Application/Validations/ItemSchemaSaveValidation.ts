import { z } from 'zod';

const ItemDetailSchema = z.object({
    productName: z.string().min(1).max(255),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    discountPercentage: z.number().min(0).max(100).optional().default(0)
}).refine(
  (data) =>
{
    // Business rule: Subtotal should not exceed reasonable limits
    const subtotal = data.quantity * data.unitPrice;
    return subtotal <= 1000000; // Max 1M per line item
  },
  {
    message: 'Line item subtotal exceeds maximum allowed amount (1,000,000)'
  }
);

// Base schema without refinements - can be merged
export const ItemSchemaBase = z.object({
    number: z.string().min(1).max(50),
    date: z.string().datetime().or(z.date()),
    customerName: z.string().min(1).max(255),
    details: z.array(ItemDetailSchema).min(1, 'At least one detail is required')
});

// Schema for update operation - includes ID
export const ItemSchemaUpdateBase = ItemSchemaBase.extend({
    id: z.string().uuid()
});

// Schema with refinements for save operation
export const ItemSchemaSaveValidation = ItemSchemaBase.refine(
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

// Schema with refinements for update operation (includes ID)
export const ItemSchemaUpdateValidation = ItemSchemaUpdateBase.refine(
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
