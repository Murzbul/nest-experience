import IItemDomain from '../Entities/IItemDomain';
import ItemStatus from '../Enums/ItemStatus';

/**
 * Domain Service for managing Item status transitions and validations.
 * This service encapsulates business logic related to item status that doesn't
 * belong to a single entity.
 */
class ItemStatusService
{
  /**
   * Determines the current status of an item based on business rules.
   * @param item - The item header to evaluate
   * @param paidDate - Optional payment date
   * @param cancelledDate - Optional cancellation date
   * @returns The calculated item status
   */
  static calculateStatus(
    item: IItemDomain,
    paidDate?: Date,
    cancelledDate?: Date
  ): ItemStatus
  {
    // Cancelled items take precedence
    if (cancelledDate)
    {
      return ItemStatus.CANCELLED;
    }

    // Paid items
    if (paidDate)
    {
      return ItemStatus.PAID;
    }

    // Check if item is overdue (more than 30 days old)
    const daysSinceCreation = this.getDaysSince(item.date);
    if (daysSinceCreation > 30)
    {
      return ItemStatus.OVERDUE;
    }

    // Items with details are confirmed, without are draft
    return item.hasDetails() ? ItemStatus.CONFIRMED : ItemStatus.DRAFT;
  }

  /**
   * Validates if a status transition is allowed based on business rules.
   * @param currentStatus - Current item status
   * @param newStatus - Desired new status
   * @returns True if transition is allowed, false otherwise
   */
  static canTransitionTo(currentStatus: ItemStatus, newStatus: ItemStatus): boolean
  {
    // Define allowed transitions
    const allowedTransitions: Record<ItemStatus, ItemStatus[]> = {
      [ItemStatus.DRAFT]: [ItemStatus.CONFIRMED, ItemStatus.CANCELLED],
      [ItemStatus.CONFIRMED]: [ItemStatus.PAID, ItemStatus.CANCELLED, ItemStatus.OVERDUE],
      [ItemStatus.PAID]: [], // Paid items cannot transition
      [ItemStatus.CANCELLED]: [], // Cancelled items cannot transition
      [ItemStatus.OVERDUE]: [ItemStatus.PAID, ItemStatus.CANCELLED]
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * Validates if an item can be modified based on its status.
   * @param status - Current item status
   * @returns True if item can be modified
   */
  static canModify(status: ItemStatus): boolean
  {
    // Only draft and confirmed items can be modified
    return status === ItemStatus.DRAFT || status === ItemStatus.CONFIRMED;
  }

  /**
   * Validates if an item can be deleted based on its status.
   * @param status - Current item status
   * @returns True if item can be deleted
   */
  static canDelete(status: ItemStatus): boolean
  {
    // Only draft items can be deleted
    return status === ItemStatus.DRAFT;
  }

  /**
   * Calculates the number of days since a given date.
   * @param date - The date to calculate from
   * @returns Number of days since the date
   */
  private static getDaysSince(date: Date): number
  {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Gets user-friendly status description.
   * @param status - The item status
   * @returns Human-readable status description
   */
  static getStatusDescription(status: ItemStatus): string
  {
    const descriptions: Record<ItemStatus, string> = {
      [ItemStatus.DRAFT]: 'Item is in draft state and can be modified',
      [ItemStatus.CONFIRMED]: 'Item is confirmed and awaiting payment',
      [ItemStatus.PAID]: 'Item has been paid',
      [ItemStatus.CANCELLED]: 'Item has been cancelled',
      [ItemStatus.OVERDUE]: 'Item is overdue for payment'
    };

    return descriptions[status];
  }
}

export default ItemStatusService;
