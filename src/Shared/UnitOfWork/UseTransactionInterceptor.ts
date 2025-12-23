import { Injectable, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { TransactionManager } from '@shared/UnitOfWork/TransactionManager';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Injectable()
export class UseTransactionInterceptor implements NestInterceptor
{
  constructor(
      private readonly transactionManager: TransactionManager)
  {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>
  {
    const transactionContext = await this.transactionManager.createTransactionContext('[Transaction]');

    return next.handle().pipe(
      // Rollback
      catchError(async(error) =>
      {
        await this.transactionManager.rollbackTransaction(transactionContext, error as Error, '[Transaction]');
        throw error;
      }),
      finalize(async() =>
      {
        try
        {
          await this.transactionManager.commitTransaction(transactionContext, '[Transaction]');
        }
        catch (commitErr)
        {
          // The TransactionManager already handles rollback in case of commit failure.
          // This catch block is intentionally left empty since any error during commit
          // will be automatically handled by the TransactionManager's error handling mechanism.
        }
        finally
        {
          await this.transactionManager.cleanupTransactionContext(transactionContext, '[Transaction]');
        }
      })
    );
  }
}
