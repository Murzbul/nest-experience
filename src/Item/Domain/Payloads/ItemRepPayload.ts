import ItemDetailRepPayload from './ItemDetailRepPayload';

interface ItemRepPayload
{
  number: string;
  date: Date | string;
  customerName: string;
  details: ItemDetailRepPayload[];
}

export default ItemRepPayload;
