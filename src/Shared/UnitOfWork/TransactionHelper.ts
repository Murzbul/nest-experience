import { Injectable } from '@nestjs/common';
import { TransactionManager } from '@shared/UnitOfWork/TransactionManager';

@Injectable()
export class TransactionHelper
{
  constructor(
    private readonly transactionManager: TransactionManager
  )
  {}

  async executeInTransaction<T>(operation: () => Promise<T>): Promise<T>
  {
    return this.transactionManager.executeInTransaction(operation, '[TransactionHelper]');
  }
}
