import Item from '@item/Domain/Entities/Item';
import ItemDetail from '@item/Domain/Entities/ItemDetail';
import ItemRepPayload from '@item/Domain/Payloads/ItemRepPayload';
import { ItemDetailEntity } from '@item/Infrastructure/Schemas/ItemDetailSchema';
import { ItemEntity } from '@item/Infrastructure/Schemas/ItemSchema';
import dayjs from 'dayjs';

export class ItemFactory
{
  /**
   * Convert TypeORM Entity to Domain Entity
   */
  static fromEntity(entity: ItemEntity, details: ItemDetailEntity[] = []): Item
  {
    const itemHeader = new Item(
      entity.number,
      entity.date,
      entity.customerName,
      entity.id
    );

    itemHeader.createdAt = dayjs(entity.createdAt).toISOString();
    itemHeader.updatedAt = dayjs(entity.updatedAt).toISOString();

    // Add details to the aggregate
    details.forEach(detailEntity =>
    {
      const detail = new ItemDetail(
        detailEntity.itemHeaderId,
        detailEntity.productName,
        detailEntity.quantity,
        detailEntity.unitPrice,
        detailEntity.id,
        detailEntity.discountPercentage || 0
      );

      detail.createdAt = dayjs(detailEntity.createdAt).toISOString();
      detail.updatedAt = dayjs(detailEntity.updatedAt).toISOString();

      itemHeader.addDetail(detail);
    });

    return itemHeader;
  }

  /**
   * Convert Domain Entity to TypeORM Entity
   */
  static toEntity(itemHeader: Item): ItemEntity
  {
    const entity = new ItemEntity();
    entity.id = itemHeader.id;
    entity.number = itemHeader.number;
    entity.date = itemHeader.date;
    entity.customerName = itemHeader.customerName;
    entity.totalAmount = itemHeader.totalAmount;
    entity.createdAt = dayjs(itemHeader.createdAt).toDate();
    entity.updatedAt = dayjs(itemHeader.updatedAt).toDate();

    return entity;
  }

  /**
   * Convert details to entities
   */
  static detailsToEntities(itemHeader: Item): ItemDetailEntity[]
  {
    return itemHeader.details.map(detail =>
    {
      const entity = new ItemDetailEntity();
      entity.id = detail.id;
      entity.itemHeaderId = itemHeader.id; // Use the itemHeader's ID, not the detail's itemHeaderId
      entity.productName = detail.productName;
      entity.quantity = detail.quantity;
      entity.unitPrice = detail.unitPrice;
      entity.subtotal = detail.subtotal;
      entity.discountPercentage = detail.discountPercentage;
      entity.createdAt = dayjs(detail.createdAt).toDate();
      entity.updatedAt = dayjs(detail.updatedAt).toDate();

      return entity;
    });
  }

  /**
   * Create from Payload
   */
  static fromPayload(payload: ItemRepPayload, id?: string): Item
  {
    const date = typeof payload.date === 'string' ? new Date(payload.date) : payload.date;

    const itemHeader = new Item(
      payload.number,
      date,
      payload.customerName,
      id
    );

    // Add details
    payload.details.forEach(detailPayload =>
    {
      const detail = new ItemDetail(
        itemHeader.id, // Will be set when itemHeader gets an id
        detailPayload.productName,
        detailPayload.quantity,
        detailPayload.unitPrice,
        undefined,
        detailPayload.discountPercentage || 0
      );

      itemHeader.addDetail(detail);
    });

    return itemHeader;
  }
}

export default ItemFactory;
