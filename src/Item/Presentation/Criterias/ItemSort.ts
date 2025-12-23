import { MapCriteria } from '@shared/Criteria/MapCriteria';

class ItemSort extends MapCriteria
{
    static readonly CUSTOMER_NAME: string = 'customerName';
    static readonly NUMBER: string = 'number';
    static readonly DATE: string = 'date';

    getFields(): string[]
    {
        return [
            ItemSort.CUSTOMER_NAME,
            ItemSort.NUMBER,
            ItemSort.DATE
        ];
    }

    getDefaults(): Record<string, 'asc' | 'desc'>[]
    {
        return [
            { [ItemSort.DATE]: 'desc' }
        ];
    }
}

export default ItemSort;
