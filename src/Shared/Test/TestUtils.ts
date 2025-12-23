import UnitOfWorkConstants from '@shared/UnitOfWork/UnitOfWorkConstants';
import { ClsService } from 'nestjs-cls';
import { DataSource, QueryRunner } from 'typeorm';

export async function withUnitOfWork<T>(clsService: ClsService, ds: DataSource, testFunction: (queryRunner: QueryRunner) => Promise<T>): Promise<T>
{
  return await clsService.run(async() =>
  {
    const queryRunner: QueryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    clsService.set(UnitOfWorkConstants.UNIT_OF_WORK_KEY, queryRunner);

    try
    {
      return await testFunction(queryRunner);
    }
    finally
    {
      if (!queryRunner.isReleased)
      {
        await queryRunner.release();
      }
    }
  });
}
