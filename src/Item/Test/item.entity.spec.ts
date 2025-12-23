import { describe, expect, test } from 'vitest';

import Item from '../Domain/Entities/Item';
import ItemDetail from '../Domain/Entities/ItemDetail';
import ItemRepPayload from '../Domain/Payloads/ItemRepPayload';
import ItemFactory from '../Infrastructure/Factories/ItemFactory';

describe('Item Entity', () =>
{
  const baseItemHeaderPayload: ItemRepPayload = {
    number: 'INV-001',
    date: new Date('2024-01-15'),
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

  describe('Item Creation', () =>
  {
    test('should create item header with all required fields', () =>
    {
      const item = ItemFactory.fromPayload(baseItemHeaderPayload);

      expect(item.number).toBe('INV-001');
      expect(item.customerName).toBe('John Doe');
      expect(item.date).toEqual(new Date('2024-01-15'));
      expect(item.totalAmount).toBe(130); // (2*50) + (1*30)
      expect(item.details).toHaveLength(2);
    });

    test('should create item header with details', () =>
    {
      const item = ItemFactory.fromPayload(baseItemHeaderPayload);

      expect(item.details).toHaveLength(2);

      const detail1 = item.details[0];
      expect(detail1.productName).toBe('Product A');
      expect(detail1.quantity).toBe(2);
      expect(detail1.unitPrice).toBe(50.00);
      expect(detail1.subtotal).toBe(100.00);

      const detail2 = item.details[1];
      expect(detail2.productName).toBe('Product B');
      expect(detail2.quantity).toBe(1);
      expect(detail2.unitPrice).toBe(30.00);
      expect(detail2.subtotal).toBe(30.00);
    });

    test('should create item header with discount', () =>
    {
      const payload: ItemRepPayload = {
        number: 'INV-002',
        date: new Date('2024-01-16'),
        customerName: 'Jane Smith',
        details: [
          {
            productName: 'Product C',
            quantity: 2,
            unitPrice: 100.00,
            discountPercentage: 10 // 10% discount
          }
        ]
      };

      const item = ItemFactory.fromPayload(payload);

      expect(item.totalAmount).toBe(180); // 2 * 100 - 10% = 180
      expect(item.details[0].discountPercentage).toBe(10);
      expect(item.details[0].subtotal).toBe(180);
    });

    test('should create item header from direct constructor', () =>
    {
      const item = new Item(
        'INV-003',
        new Date('2024-01-17'),
        'Test Customer'
      );

      expect(item.number).toBe('INV-003');
      expect(item.customerName).toBe('Test Customer');
      expect(item.totalAmount).toBe(0); // No details yet
      expect(item.details).toHaveLength(0);
    });
  });

  describe('Item Business Logic', () =>
  {
    test('should add detail and recalculate total', () =>
    {
      const item = new Item(
        'INV-004',
        new Date('2024-01-18'),
        'Customer A'
      );

      expect(item.totalAmount).toBe(0);

      const detail = new ItemDetail(
        item.id,
        'Product X',
        3,
        25.00
      );

      item.addDetail(detail);

      expect(item.details).toHaveLength(1);
      expect(item.totalAmount).toBe(75.00); // 3 * 25
    });

    test('should add multiple details and calculate total correctly', () =>
    {
      const item = new Item(
        'INV-005',
        new Date('2024-01-19'),
        'Customer B'
      );

      const detail1 = new ItemDetail(item.id, 'Product 1', 2, 50.00);
      const detail2 = new ItemDetail(item.id, 'Product 2', 1, 30.00);
      const detail3 = new ItemDetail(item.id, 'Product 3', 4, 15.00);

      item.addDetail(detail1);
      item.addDetail(detail2);
      item.addDetail(detail3);

      expect(item.details).toHaveLength(3);
      expect(item.totalAmount).toBe(190.00); // (2*50) + (1*30) + (4*15)
    });

    test('should remove detail and recalculate total', () =>
    {
      const item = ItemFactory.fromPayload(baseItemHeaderPayload);

      expect(item.totalAmount).toBe(130);
      expect(item.details).toHaveLength(2);

      const detailToRemove = item.details[0];
      item.removeDetail(detailToRemove.id);

      expect(item.details).toHaveLength(1);
      expect(item.totalAmount).toBe(30.00); // Only Product B remains
    });

    test('should throw error when removing non-existent detail', () =>
    {
      const item = ItemFactory.fromPayload(baseItemHeaderPayload);

      expect(() => item.removeDetail('non-existent-id'))
        .toThrow('Detail with id non-existent-id not found');
    });

    test('should update customer name', () =>
    {
      const item = new Item(
        'INV-006',
        new Date('2024-01-20'),
        'Original Customer'
      );

      expect(item.customerName).toBe('Original Customer');

      item.updateCustomerName('Updated Customer');

      expect(item.customerName).toBe('Updated Customer');
    });

    test('should throw error when updating customer name to empty', () =>
    {
      const item = new Item(
        'INV-007',
        new Date('2024-01-21'),
        'Customer'
      );

      expect(() => item.updateCustomerName(''))
        .toThrow('Customer name cannot be empty');

      expect(() => item.updateCustomerName('   '))
        .toThrow('Customer name cannot be empty');
    });

    test('should check if has details', () =>
    {
      const item = new Item(
        'INV-008',
        new Date('2024-01-22'),
        'Customer'
      );

      expect(item.hasDetails()).toBe(false);

      const detail = new ItemDetail(item.id, 'Product', 1, 10.00);
      item.addDetail(detail);

      expect(item.hasDetails()).toBe(true);
    });

    test('should get correct detail count', () =>
    {
      const item = ItemFactory.fromPayload(baseItemHeaderPayload);

      expect(item.getDetailCount()).toBe(2);

      const newDetail = new ItemDetail(item.id, 'Product C', 1, 20.00);
      item.addDetail(newDetail);

      expect(item.getDetailCount()).toBe(3);
    });
  });

  describe('Readonly Properties', () =>
  {
    test('should have readonly number', () =>
    {
      const item = new Item(
        'INV-009',
        new Date('2024-01-23'),
        'Customer'
      );

      expect(item.number).toBe('INV-009');
      expect(typeof item.number).toBe('string');
    });

    test('should have readonly date', () =>
    {
      const testDate = new Date('2024-01-24');
      const item = new Item(
        'INV-010',
        testDate,
        'Customer'
      );

      expect(item.date).toEqual(testDate);
      expect(item.date instanceof Date).toBe(true);
    });
  });
});

describe('ItemDetail Entity', () =>
{
  describe('Detail Creation', () =>
  {
    test('should create detail with correct properties', () =>
    {
      const detail = new ItemDetail(
        'header-123',
        'Product X',
        5,
        20.00
      );

      expect(detail.itemHeaderId).toBe('header-123');
      expect(detail.productName).toBe('Product X');
      expect(detail.quantity).toBe(5);
      expect(detail.unitPrice).toBe(20.00);
      expect(detail.subtotal).toBe(100.00);
      expect(detail.discountPercentage).toBe(0);
    });

    test('should create detail with discount', () =>
    {
      const detail = new ItemDetail(
        'header-123',
        'Product Y',
        2,
        50.00,
        undefined,
        10 // 10% discount
      );

      expect(detail.discountPercentage).toBe(10);
      expect(detail.subtotal).toBe(90.00); // 2 * 50 - 10% = 90
      expect(detail.discountAmount).toBe(10.00);
      expect(detail.finalSubtotal).toBe(90.00);
    });

    test('should create detail with ID', () =>
    {
      const detail = new ItemDetail(
        'header-123',
        'Product Z',
        1,
        100.00,
        'custom-id-123'
      );

      expect(detail.id).toBe('custom-id-123');
    });
  });

  describe('Detail Business Logic', () =>
  {
    test('should update quantity and recalculate subtotal', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 2, 25.00);

      expect(detail.quantity).toBe(2);
      expect(detail.subtotal).toBe(50.00);

      detail.updateQuantity(5);

      expect(detail.quantity).toBe(5);
      expect(detail.subtotal).toBe(125.00);
    });

    test('should throw error when updating quantity to zero or negative', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 2, 25.00);

      expect(() => detail.updateQuantity(0))
        .toThrow('Quantity must be greater than zero');

      expect(() => detail.updateQuantity(-1))
        .toThrow('Quantity must be greater than zero');
    });

    test('should update unit price and recalculate subtotal', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 3, 10.00);

      expect(detail.unitPrice).toBe(10.00);
      expect(detail.subtotal).toBe(30.00);

      detail.updateUnitPrice(15.00);

      expect(detail.unitPrice).toBe(15.00);
      expect(detail.subtotal).toBe(45.00);
    });

    test('should throw error when updating unit price to zero or negative', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 2, 25.00);

      expect(() => detail.updateUnitPrice(0))
        .toThrow('Unit price must be greater than zero');

      expect(() => detail.updateUnitPrice(-10))
        .toThrow('Unit price must be greater than zero');
    });

    test('should update product name', () =>
    {
      const detail = new ItemDetail('header-123', 'Original Name', 1, 10.00);

      expect(detail.productName).toBe('Original Name');

      detail.updateProductName('Updated Name');

      expect(detail.productName).toBe('Updated Name');
    });

    test('should throw error when updating product name to empty', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 1, 10.00);

      expect(() => detail.updateProductName(''))
        .toThrow('Product name cannot be empty');

      expect(() => detail.updateProductName('   '))
        .toThrow('Product name cannot be empty');
    });

    test('should apply discount', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 2, 100.00);

      expect(detail.discountPercentage).toBe(0);
      expect(detail.subtotal).toBe(200.00);

      detail.applyDiscount(20); // 20% discount

      expect(detail.discountPercentage).toBe(20);
      expect(detail.subtotal).toBe(160.00); // 200 - 20%
      expect(detail.hasDiscount()).toBe(true);
    });

    test('should remove discount', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 2, 100.00, undefined, 15);

      expect(detail.hasDiscount()).toBe(true);
      expect(detail.subtotal).toBe(170.00);

      detail.removeDiscount();

      expect(detail.hasDiscount()).toBe(false);
      expect(detail.discountPercentage).toBe(0);
      expect(detail.subtotal).toBe(200.00);
    });

    test('should throw error when applying invalid discount percentage', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 1, 50.00);

      expect(() => detail.applyDiscount(-5))
        .toThrow('Discount percentage must be between 0 and 100');

      expect(() => detail.applyDiscount(101))
        .toThrow('Discount percentage must be between 0 and 100');
    });

    test('should validate detail correctly', () =>
    {
      const validDetail = new ItemDetail('header-123', 'Product', 2, 50.00);
      expect(validDetail.isValid()).toBe(true);

      expect(() => validDetail.validate()).not.toThrow();
    });

    test('should clone detail without ID', () =>
    {
      const original = new ItemDetail(
        'header-123',
        'Product',
        3,
        25.00,
        'original-id',
        10
      );

      const cloned = original.clone();

      expect(cloned.itemHeaderId).toBe('header-123');
      expect(cloned.productName).toBe('Product');
      expect(cloned.quantity).toBe(3);
      expect(cloned.unitPrice).toBe(25.00);
      expect(cloned.discountPercentage).toBe(10);
      // Cloned detail should not have the same ID as the original
      expect(cloned.id).not.toBe('original-id');
    });

    test('should check equality between details', () =>
    {
      const detail1 = new ItemDetail('header-123', 'Product', 2, 50.00, undefined, 10);
      const detail2 = new ItemDetail('header-456', 'Product', 2, 50.00, undefined, 10);
      const detail3 = new ItemDetail('header-123', 'Product', 3, 50.00, undefined, 10);

      expect(detail1.equals(detail2)).toBe(true); // Same values
      expect(detail1.equals(detail3)).toBe(false); // Different quantity
    });

    test('should format subtotal with currency symbol', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 2, 25.50);

      expect(detail.getFormattedSubtotal()).toBe('$51.00');
      expect(detail.getFormattedSubtotal('€')).toBe('€51.00');
    });

    test('should get discount description', () =>
    {
      const detailWithoutDiscount = new ItemDetail('header-123', 'Product', 2, 50.00);
      expect(detailWithoutDiscount.getDiscountDescription()).toBe('No discount applied');

      const detailWithDiscount = new ItemDetail('header-123', 'Product', 2, 50.00, undefined, 15);
      expect(detailWithDiscount.getDiscountDescription()).toContain('15% discount');
      expect(detailWithDiscount.getDiscountDescription()).toContain('15.00 off');
    });

    test('should get summary', () =>
    {
      const detail = new ItemDetail('header-123', 'Product X', 3, 20.00);
      const summary = detail.getSummary();

      expect(summary).toContain('Product X');
      expect(summary).toContain('Qty: 3');
      expect(summary).toContain('$20');
      expect(summary).toContain('$60.00');
    });
  });

  describe('Calculated Properties', () =>
  {
    test('should calculate discount amount correctly', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 4, 25.00, undefined, 10);

      expect(detail.discountAmount).toBe(10.00); // 10% of 100
    });

    test('should calculate final subtotal with discount', () =>
    {
      const detail = new ItemDetail('header-123', 'Product', 2, 50.00, undefined, 20);

      expect(detail.finalSubtotal).toBe(80.00); // 100 - 20%
    });
  });
});
