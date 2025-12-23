import IBaseDomain from '@shared/Entities/IBaseDomain';

interface IItemDetailDomain extends IBaseDomain
{
  readonly itemHeaderId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly discountPercentage: number;
  readonly discountAmount: number;
  readonly finalSubtotal: number;
}

export default IItemDetailDomain;
