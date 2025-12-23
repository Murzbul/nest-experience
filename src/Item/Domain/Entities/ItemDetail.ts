import { randomUUID } from 'crypto';

import BaseDomain from '@shared/Entities/BaseDomain';

import IItemDetailDomain from './IItemDetailDomain';

class ItemDetail extends BaseDomain implements IItemDetailDomain
{
  private readonly _itemHeaderId: string;
  private _productName: string;
  private _quantity: number;
  private _unitPrice: number;
  private _subtotal: number;
  private _discountPercentage: number;

  constructor(
    itemHeaderId: string,
    productName: string,
    quantity: number,
    unitPrice: number,
    id?: string,
    discountPercentage: number = 0
  )
  {
    super();
    this._itemHeaderId = itemHeaderId;
    this._productName = productName;
    this._quantity = quantity;
    this._unitPrice = unitPrice;
    this._discountPercentage = discountPercentage;
    this._subtotal = this.calculateSubtotal();

    // Generate UUID if not provided
    this.id = id || randomUUID();
  }

  // Getters
  get itemHeaderId(): string
  {
    return this._itemHeaderId;
  }

  get productName(): string
  {
    return this._productName;
  }

  get quantity(): number
  {
    return this._quantity;
  }

  get unitPrice(): number
  {
    return this._unitPrice;
  }

  get subtotal(): number
  {
    return this._subtotal;
  }

  get discountPercentage(): number
  {
    return this._discountPercentage;
  }

  // Calculated properties
  get discountAmount(): number
  {
    const baseAmount = this._quantity * this._unitPrice;
    return Number((baseAmount * (this._discountPercentage / 100)).toFixed(2));
  }

  get finalSubtotal(): number
  {
    const baseAmount = this._quantity * this._unitPrice;
    return Number((baseAmount - this.discountAmount).toFixed(2));
  }

  // Business logic - Basic calculations
  private calculateSubtotal(): number
  {
    const baseAmount = this._quantity * this._unitPrice;
    const discountAmount = baseAmount * (this._discountPercentage / 100);
    return Number((baseAmount - discountAmount).toFixed(2));
  }

  // Business logic - Update methods
  updateQuantity(quantity: number): void
  {
    if (quantity <= 0)
    {
      throw new Error('Quantity must be greater than zero');
    }

    this._quantity = quantity;
    this._subtotal = this.calculateSubtotal();
  }

  updateUnitPrice(unitPrice: number): void
  {
    if (unitPrice <= 0)
    {
      throw new Error('Unit price must be greater than zero');
    }

    this._unitPrice = unitPrice;
    this._subtotal = this.calculateSubtotal();
  }

  updateProductName(productName: string): void
  {
    if (!productName || productName.trim() === '')
    {
      throw new Error('Product name cannot be empty');
    }

    this._productName = productName;
  }

  // Business logic - Discount management
  applyDiscount(discountPercentage: number): void
  {
    if (discountPercentage < 0 || discountPercentage > 100)
    {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    this._discountPercentage = discountPercentage;
    this._subtotal = this.calculateSubtotal();
  }

  removeDiscount(): void
  {
    this._discountPercentage = 0;
    this._subtotal = this.calculateSubtotal();
  }

  hasDiscount(): boolean
  {
    return this._discountPercentage > 0;
  }

  // Business logic - Validation
  isValid(): boolean
  {
    try
    {
      this.validate();
      return true;
    }
    catch
    {
      return false;
    }
  }

  validate(): void
  {
    if (!this._productName || this._productName.trim() === '')
    {
      throw new Error('Product name is required');
    }

    if (this._quantity <= 0)
    {
      throw new Error('Quantity must be greater than zero');
    }

    if (this._unitPrice <= 0)
    {
      throw new Error('Unit price must be greater than zero');
    }

    if (this._discountPercentage < 0 || this._discountPercentage > 100)
    {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    // Business rule: Maximum line item total
    const baseTotal = this._quantity * this._unitPrice;
    if (baseTotal > 1000000)
    {
      throw new Error('Line item total exceeds maximum allowed (1,000,000)');
    }
  }

  // Business logic - Comparison and cloning
  equals(other: ItemDetail): boolean
  {
    return (
      this._productName === other._productName &&
      this._quantity === other._quantity &&
      this._unitPrice === other._unitPrice &&
      this._discountPercentage === other._discountPercentage
    );
  }

  clone(): ItemDetail
  {
    const cloned = new ItemDetail(
      this._itemHeaderId,
      this._productName,
      this._quantity,
      this._unitPrice,
      undefined, // Don't copy ID
      this._discountPercentage
    );
    return cloned;
  }

  // Business logic - Display and formatting
  getFormattedSubtotal(currencySymbol: string = '$'): string
  {
    return `${currencySymbol}${this._subtotal.toFixed(2)}`;
  }

  getDiscountDescription(): string
  {
    if (!this.hasDiscount())
    {
      return 'No discount applied';
    }
    return `${this._discountPercentage}% discount (${this.discountAmount.toFixed(2)} off)`;
  }

  getSummary(): string
  {
    const baseAmount = this._quantity * this._unitPrice;
    let summary = `${this._productName} - Qty: ${this._quantity} x $${this._unitPrice} = $${baseAmount.toFixed(2)}`;

    if (this.hasDiscount())
    {
      summary += ` (${this._discountPercentage}% off) = $${this._subtotal.toFixed(2)}`;
    }

    return summary;
  }
}

export default ItemDetail;
