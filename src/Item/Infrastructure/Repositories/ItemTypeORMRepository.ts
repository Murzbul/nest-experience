import Item from '@item/Domain/Entities/Item';
import IItemRepository from '@item/Domain/Repositories/IItemRepository';
import ItemFactory from '@item/Infrastructure/Factories/ItemFactory';
import { ItemDetailEntity, ItemDetailSchema } from '@item/Infrastructure/Schemas/ItemDetailSchema';
import { ItemEntity, ItemSchema } from '@item/Infrastructure/Schemas/ItemSchema';
import { Injectable } from '@nestjs/common';
import { ICriteria } from '@shared/Criteria/ICriteria';
import { IPaginator } from '@shared/Criteria/IPaginator';
import IByOptions from '@shared/Repositories/IByOptions';
import UnitOfWorkConstants from '@shared/UnitOfWork/UnitOfWorkConstants';
import TypeORMPaginator from '@shared/Utils/TypeORMPaginator';
import { ClsService } from 'nestjs-cls';
import { DataSource, Repository } from 'typeorm';
import { EntityManager, QueryRunner } from 'typeorm';

@Injectable()
class ItemTypeORMRepository implements IItemRepository
{
  protected readonly dataSource: DataSource;
  protected readonly cls: ClsService;

  constructor(
    cls: ClsService,
    dataSource: DataSource
  )
  {
    this.cls = cls;
    this.dataSource = dataSource;
  }

  protected get writeRepository(): Repository<ItemEntity>
  {
    const clsManager =
      this.cls.get<EntityManager>(UnitOfWorkConstants.MANAGER_KEY) ??
      this.cls.get<QueryRunner>(UnitOfWorkConstants.UNIT_OF_WORK_KEY)?.manager;

    const manager = clsManager ?? this.dataSource.manager;
    return manager.getRepository(ItemSchema);
  }

  protected get readRepository(): Repository<ItemEntity>
  {
    return this.dataSource.getRepository(ItemSchema);
  }

  async save(item: Item): Promise<Item>
  {
    const headerEntity = ItemFactory.toEntity(item);
    const savedHeader = await this.writeRepository.save(headerEntity);

    // Update item details with the saved header ID
    const detailEntities = item.details.map(detail =>
    {
      const entity = new ItemDetailEntity();
      entity.id = detail.id;
      entity.itemHeaderId = savedHeader.id; // Use the saved header ID
      entity.productName = detail.productName;
      entity.quantity = detail.quantity;
      entity.unitPrice = detail.unitPrice;
      entity.subtotal = detail.subtotal;
      entity.discountPercentage = detail.discountPercentage;
      return entity;
    });

    const detailRepo = this.dataSource.getRepository(ItemDetailSchema);
    const savedDetails = await detailRepo.save(detailEntities);

    return ItemFactory.fromEntity(savedHeader, savedDetails);
  }

  async update(item: Item): Promise<Item>
  {
    const headerEntity = ItemFactory.toEntity(item);

    // Use update instead of save to force an UPDATE query
    await this.writeRepository.update({ id: item.id }, {
      number: headerEntity.number,
      date: headerEntity.date,
      customerName: headerEntity.customerName,
      totalAmount: headerEntity.totalAmount,
      updatedAt: headerEntity.updatedAt
    });

    // Get detail repository using the same manager as header
    const clsManager =
      this.cls.get<EntityManager>(UnitOfWorkConstants.MANAGER_KEY) ??
      this.cls.get<QueryRunner>(UnitOfWorkConstants.UNIT_OF_WORK_KEY)?.manager;
    const manager = clsManager ?? this.dataSource.manager;
    const detailRepo = manager.getRepository(ItemDetailSchema);

    await detailRepo.delete({ itemHeaderId: item.id });

    const detailEntities = ItemFactory.detailsToEntities(item);
    await detailRepo.save(detailEntities);

    return item;
  }

  async getOne(id: string): Promise<Item>
  {
    return this.findWithDetails(id);
  }

  async delete(id: string): Promise<Item>
  {
    const itemHeader = await this.findWithDetails(id);
    await this.writeRepository.delete(id);
    return itemHeader;
  }

  async findWithDetails(id: string): Promise<Item>
  {
    const headerEntity = await this.readRepository.findOne({ where: { id } });

    if (!headerEntity)
    {
      throw new Error('ItemHeader not found');
    }

    const detailRepo = this.dataSource.getRepository(ItemDetailSchema);
    const detailEntities = await detailRepo.find({ where: { itemHeaderId: id } });

    return ItemFactory.fromEntity(headerEntity, detailEntities);
  }

  async findByNumber(number: string): Promise<Item | null>
  {
    const headerEntity = await this.readRepository.findOne({ where: { number } });

    if (!headerEntity)
    {
      return null;
    }

    const detailRepo = this.dataSource.getRepository(ItemDetailSchema);
    const detailEntities = await detailRepo.find({ where: { itemHeaderId: headerEntity.id } });

    return ItemFactory.fromEntity(headerEntity, detailEntities);
  }

  async getBy(condition: Record<string, any>, options: IByOptions): Promise<Item[]>
  {
    const headerEntities = await this.readRepository.find({ where: condition });

    const items: Item[] = [];
    for (const headerEntity of headerEntities)
    {
      const detailRepo = this.dataSource.getRepository(ItemDetailSchema);
      const detailEntities = await detailRepo.find({ where: { itemHeaderId: headerEntity.id } });
      items.push(ItemFactory.fromEntity(headerEntity, detailEntities));
    }

    return items;
  }

  async getOneBy(condition: Record<string, any>, options: IByOptions): Promise<Item | null>
  {
    const headerEntity = await this.readRepository.findOne({ where: condition });

    if (!headerEntity)
    {
      return null;
    }

    const detailRepo = this.dataSource.getRepository(ItemDetailSchema);
    const detailEntities = await detailRepo.find({ where: { itemHeaderId: headerEntity.id } });

    return ItemFactory.fromEntity(headerEntity, detailEntities);
  }

  async getInBy(condition: Record<string, string[]>): Promise<Item[]>
  {
    const [key, values] = Object.entries(condition)[0];
    const headerEntities = await this.readRepository
      .createQueryBuilder('itemHeader')
      .where(`itemHeader.${key} IN (:...values)`, { values })
      .getMany();

    const items: Item[] = [];
    for (const headerEntity of headerEntities)
    {
      const detailRepo = this.dataSource.getRepository(ItemDetailSchema);
      const detailEntities = await detailRepo.find({ where: { itemHeaderId: headerEntity.id } });
      items.push(ItemFactory.fromEntity(headerEntity, detailEntities));
    }

    return items;
  }

  list(criteria: ICriteria): IPaginator
  {
    const queryBuilder = this.readRepository.createQueryBuilder('itemHeader');

    const filter = criteria.getFilter();

    if (filter.has('customerName'))
    {
      const customerName = filter.get('customerName');
      queryBuilder.andWhere('itemHeader.customerName ILIKE :customerName', {
        customerName: `%${customerName}%`
      });
    }

    const paginator = new TypeORMPaginator(queryBuilder, criteria);
    paginator.setTransformFunction((entity: ItemEntity) =>
      ItemFactory.fromEntity(entity, [])
    );

    return paginator;
  }
}

export default ItemTypeORMRepository;
