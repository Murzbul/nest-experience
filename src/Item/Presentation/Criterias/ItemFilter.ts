import { MapCriteria } from '@shared/Criteria/MapCriteria';

class ItemFilter extends MapCriteria
{
    static readonly CUSTOMER_NAME: string = 'customerName';
    static readonly NUMBER: string = 'number';

    getFields(): string[]
    {
        return [
            ItemFilter.CUSTOMER_NAME,
            ItemFilter.NUMBER
        ];
    }

    getDefaults(): Record<string, number | boolean | string>[]
    {
        return [];
    }
}

export default ItemFilter;
