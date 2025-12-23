import { QueryHandlers } from '@item/Application/Handlers';
import IItemRepository from '@item/Domain/Repositories/IItemRepository';
import ItemTypeORMRepository from '@item/Infrastructure/Repositories/ItemTypeORMRepository';
import ItemController from '@item/Presentation/Controllers/ItemController';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [ItemController],
  providers: [
    ...QueryHandlers,
    { provide: IItemRepository, useClass: ItemTypeORMRepository }
  ],
  exports: [IItemRepository]
})
export class ItemModule {}
