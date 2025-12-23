import IBaseDomain from '@shared/Entities/IBaseDomain';

import IItemDetailDomain from './IItemDetailDomain';

interface IItemDomain extends IBaseDomain
{
  readonly number: string;
  readonly date: Date;
  readonly customerName: string;
  readonly totalAmount: number;
  readonly details: IItemDetailDomain[];

  hasDetails(): boolean;
  getDetailCount(): number;
}

export default IItemDomain;
