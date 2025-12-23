import IBaseRepository from '@shared/Repositories/IBaseRepository';

import IItemDomain from '../Entities/IItemDomain';

abstract class IItemRepository extends IBaseRepository<IItemDomain>
{
  // Métodos específicos del dominio pueden agregarse aquí
  abstract findByNumber(number: string): Promise<IItemDomain | null>;
  abstract findWithDetails(id: string): Promise<IItemDomain>;
}

export default IItemRepository;
