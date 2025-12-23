import IItemDetailDomain from '../Entities/IItemDetailDomain';
import IItemDomain from '../Entities/IItemDomain';

/**
 * Metrics result interface for item calculations
 */
export interface ItemMetrics
{
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  detailCount: number;
  averageItemValue: number;
}

/**
 * Domain Service for calculating Item metrics and financial totals.
 * This service encapsulates business logic for calculations that involve
 * multiple entities or complex business rules.
 */
class ItemMetricsService
{
  /**
   * Standard tax rate (can be configured later)
   */
  private static readonly DEFAULT_TAX_RATE = 0.16; // 16% IVA

  /**
   * Calculates comprehensive metrics for an item.
   * @param item - The item header to calculate metrics for
   * @param taxRate - Optional custom tax rate (defaults to 16%)
   * @param discountPercentage - Optional discount percentage (0-100)
   * @returns Complete metrics object
   */
  static calculateMetrics(
    item: IItemDomain,
    taxRate: number = this.DEFAULT_TAX_RATE,
    discountPercentage: number = 0
  ): ItemMetrics
  {
    const details = item.details;
    const subtotal = this.calculateSubtotal(details);
    const discountAmount = this.calculateDiscount(subtotal, discountPercentage);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = this.calculateTax(subtotalAfterDiscount, taxRate);
    const totalAmount = subtotalAfterDiscount + taxAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      detailCount: details.length,
      averageItemValue: details.length > 0 ? subtotal / details.length : 0
    };
  }

  /**
   * Calculates the subtotal by summing all detail subtotals.
   * @param details - Array of item details
   * @returns The subtotal amount
   */
  static calculateSubtotal(details: IItemDetailDomain[]): number
  {
    return details.reduce((sum, detail) => sum + detail.subtotal, 0);
  }

  /**
   * Calculates tax amount based on subtotal and tax rate.
   * @param subtotal - The subtotal amount
   * @param taxRate - The tax rate (e.g., 0.16 for 16%)
   * @returns The tax amount
   */
  static calculateTax(subtotal: number, taxRate: number = this.DEFAULT_TAX_RATE): number
  {
    if (taxRate < 0 || taxRate > 1)
    {
      throw new Error('Tax rate must be between 0 and 1');
    }
    return Number((subtotal * taxRate).toFixed(2));
  }

  /**
   * Calculates discount amount based on subtotal and discount percentage.
   * @param subtotal - The subtotal amount
   * @param discountPercentage - Discount percentage (0-100)
   * @returns The discount amount
   */
  static calculateDiscount(subtotal: number, discountPercentage: number): number
  {
    if (discountPercentage < 0 || discountPercentage > 100)
    {
      throw new Error('Discount percentage must be between 0 and 100');
    }
    return Number((subtotal * (discountPercentage / 100)).toFixed(2));
  }

  /**
   * Calculates the total amount with tax and discount.
   * @param subtotal - The subtotal amount
   * @param taxRate - Optional tax rate
   * @param discountPercentage - Optional discount percentage
   * @returns The total amount
   */
  static calculateTotal(
    subtotal: number,
    taxRate: number = this.DEFAULT_TAX_RATE,
    discountPercentage: number = 0
  ): number
  {
    const discountAmount = this.calculateDiscount(subtotal, discountPercentage);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = this.calculateTax(subtotalAfterDiscount, taxRate);
    return Number((subtotalAfterDiscount + taxAmount).toFixed(2));
  }

  /**
   * Validates if the item meets minimum amount requirements.
   * @param item - The item header to validate
   * @param minimumAmount - Minimum required amount
   * @returns True if item meets minimum amount
   */
  static meetsMinimumAmount(item: IItemDomain, minimumAmount: number): boolean
  {
    return item.totalAmount >= minimumAmount;
  }

  /**
   * Validates if the item exceeds maximum amount limits.
   * @param item - The item header to validate
   * @param maximumAmount - Maximum allowed amount
   * @returns True if item is within limit
   */
  static withinMaximumAmount(item: IItemDomain, maximumAmount: number): boolean
  {
    return item.totalAmount <= maximumAmount;
  }

  /**
   * Calculates the percentage difference between expected and actual totals.
   * Useful for validating calculations.
   * @param expectedTotal - Expected total amount
   * @param actualTotal - Actual calculated total
   * @returns Percentage difference
   */
  static calculateDiscrepancy(expectedTotal: number, actualTotal: number): number
  {
    if (expectedTotal === 0) { return actualTotal === 0 ? 0 : 100; }
    return Number((Math.abs(expectedTotal - actualTotal) / expectedTotal * 100).toFixed(2));
  }

  /**
   * Validates if totals match within acceptable margin.
   * @param expectedTotal - Expected total
   * @param actualTotal - Actual total
   * @param tolerancePercentage - Acceptable tolerance percentage (default 0.01%)
   * @returns True if within tolerance
   */
  static totalsMatch(
    expectedTotal: number,
    actualTotal: number,
    tolerancePercentage: number = 0.01
  ): boolean
  {
    const discrepancy = this.calculateDiscrepancy(expectedTotal, actualTotal);
    return discrepancy <= tolerancePercentage;
  }
}

export default ItemMetricsService;
