import { randomUUID } from 'crypto';

import BaseDomain from '@shared/Entities/BaseDomain';

import IItemDetailDomain from './IItemDetailDomain';
import IItemDomain from './IItemDomain';
import ItemDetail from './ItemDetail';

class Item extends BaseDomain implements IItemDomain
{
  private readonly _number: string;
  private readonly _date: Date;
  private _customerName: string;
  private _totalAmount: number;
  private _details: ItemDetail[];

  constructor(
    number: string,
    date: Date,
    customerName: string,
    id?: string
  )
  {
    super();
    this._number = number;
    this._date = date;
    this._customerName = customerName;
    this._details = [];
    this._totalAmount = 0;

    // Generate UUID if not provided
    this.id = id || randomUUID();
  }

  // Getters
  get number(): string
  {
    return this._number;
  }

  get date(): Date
  {
    return this._date;
  }

  get customerName(): string
  {
    return this._customerName;
  }

  get totalAmount(): number
  {
    return this._totalAmount;
  }

  get details(): IItemDetailDomain[]
  {
    // Return a copy to maintain encapsulation
    return [...this._details];
  }

  // Business logic
  addDetail(detail: ItemDetail): void
  {
    this._details.push(detail);
    this.recalculateTotal();
  }

  removeDetail(detailId: string): void
  {
    const index = this._details.findIndex(d => d.id === detailId);

    if (index === -1)
    {
      throw new Error(`Detail with id ${detailId} not found`);
    }

    this._details.splice(index, 1);
    this.recalculateTotal();
  }

  updateCustomerName(customerName: string): void
  {
    if (!customerName || customerName.trim() === '')
    {
      throw new Error('Customer name cannot be empty');
    }

    this._customerName = customerName;
  }

  private recalculateTotal(): void
  {
    this._totalAmount = this._details.reduce((sum, detail) => sum + detail.subtotal, 0);
  }

  // Helper to check if has details
  hasDetails(): boolean
  {
    return this._details.length > 0;
  }

  // Get detail count
  getDetailCount(): number
  {
    return this._details.length;
  }
}

export default Item;
