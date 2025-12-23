import { Injectable, Logger } from '@nestjs/common';
import UnitOfWorkConstants from '@shared/UnitOfWork/UnitOfWorkConstants';
import { ClsService } from 'nestjs-cls';
import { DataSource, QueryRunner } from 'typeorm';

export interface TransactionContext {
  queryRunner: QueryRunner;
  ownsRunner: boolean;
}

@Injectable()
export class TransactionManager
{
  private readonly logger = new Logger(TransactionManager.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService
  )
  {}

  /**
   * Creates or reuses a QueryRunner and starts a transaction
   */
  async createTransactionContext(logPrefix: string = '[Transaction]'): Promise<TransactionContext>
  {
    this.logger.log(`${logPrefix} START - Creating transaction`);

    let queryRunner: QueryRunner | undefined = this.cls.get<QueryRunner>(UnitOfWorkConstants.UNIT_OF_WORK_KEY);
    let ownsRunner = false;

    // If there is no QueryRunner in CLS, create one and take ownership
    if (!queryRunner)
    {
      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      this.cls.set(UnitOfWorkConstants.UNIT_OF_WORK_KEY, queryRunner);
      ownsRunner = true;
      this.logger.debug(`${logPrefix} Created own QueryRunner`);
    }

    // Init transaction
    await queryRunner.startTransaction();
    this.logger.log(`${logPrefix} Transaction STARTED - Ready to execute operation`);

    // Publish the transactional manager for repos to use
    this.cls.set(UnitOfWorkConstants.MANAGER_KEY, queryRunner.manager);

    return { queryRunner, ownsRunner };
  }

  /**
   * Rolls back the transaction
   */
  async rollbackTransaction(context: TransactionContext, error: Error, logPrefix: string = '[Transaction]'): Promise<void>
  {
    this.logger.log(`${logPrefix} ROLLING BACK due to error: ${error.message}`);

    try
    {
      if (context.queryRunner.isTransactionActive)
      {
        await context.queryRunner.rollbackTransaction();
      }
    }
    catch (rbErr)
    {
      this.logger.error(`${logPrefix} Error during rollback`, rbErr);
    }
  }

  /**
   * Commits the transaction
   */
  async commitTransaction(context: TransactionContext, logPrefix: string = '[Transaction]'): Promise<void>
  {
    try
    {
      if (context.queryRunner.isTransactionActive)
      {
        await context.queryRunner.commitTransaction();
        this.logger.log(`${logPrefix} COMMITTED successfully`);
      }
    }
    catch (commitErr)
    {
      // If the commit fails, attempt rollback as safety net
      this.logger.error(`${logPrefix} Commit failed, attempting rollback`, commitErr);
      try
      {
        if (context.queryRunner.isTransactionActive)
        {
          await context.queryRunner.rollbackTransaction();
        }
      }
      catch (rb2Err)
      {
        this.logger.error(`${logPrefix} Error during rollback after commit failure`, rb2Err);
      }

      throw commitErr; // Re-throw el error original de commit
    }
  }

  /**
   * Limpia el contexto de transacción (CLS y QueryRunner)
   */
  async cleanupTransactionContext(context: TransactionContext, logPrefix: string = '[Transaction]'): Promise<void>
  {
    // Limpiar siempre el manager del contexto
    this.cls.set(UnitOfWorkConstants.MANAGER_KEY, undefined);

    // Si este contexto creó el runner, también lo libera y limpia CLS
    if (context.ownsRunner)
    {
      try
      {
        if (!context.queryRunner.isReleased)
        {
          await context.queryRunner.release();
          this.logger.debug(`${logPrefix} Released own QueryRunner`);
        }
      }
      catch (releaseErr)
      {
        this.logger.error(`${logPrefix} Error releasing QueryRunner`, releaseErr);
      }
      finally
      {
        this.cls.set(UnitOfWorkConstants.UNIT_OF_WORK_KEY, undefined);
      }
    }

    this.logger.log(`${logPrefix} END`);
  }

  /**
   * Ejecuta una operación dentro de una transacción con manejo completo de errores
   */
  async executeInTransaction<T>(
    operation: () => Promise<T>,
    logPrefix: string = '[TransactionManager]'
  ): Promise<T>
  {
    const context = await this.createTransactionContext(logPrefix);

    try
    {
      const result = await operation();
      await this.commitTransaction(context, logPrefix);
      return result;
    }
    catch (error)
    {
      await this.rollbackTransaction(context, error as Error, logPrefix);
      throw error;
    }
    finally
    {
      await this.cleanupTransactionContext(context, logPrefix);
    }
  }
}
