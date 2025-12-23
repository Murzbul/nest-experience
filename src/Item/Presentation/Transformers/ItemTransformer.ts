import { Transformer } from '@shared/Transformers';

import IItemDomain from '../../Domain/Entities/IItemDomain';

import IItemTransformer from './IItemTransformer';

class ItemTransformer extends Transformer<IItemDomain, IItemTransformer>
{
    public transform(item: IItemDomain): IItemTransformer
    {
        return {
            id: item.id,
            number: item.number,
            date: item.date instanceof Date ? item.date.toISOString() : new Date(item.date).toISOString(),
            customerName: item.customerName,
            totalAmount: item.totalAmount,
            detailCount: item.getDetailCount(),
            ...this.getTimestamp(item)
        };
    }
}

export default ItemTransformer;
