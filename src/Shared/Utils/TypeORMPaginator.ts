import { SelectQueryBuilder } from 'typeorm';

import { BasePaginator } from '../Criteria/BasePaginator';
import { ICriteria } from '../Criteria/ICriteria';
import { IPaginator } from '../Criteria/IPaginator';

class TypeORMPaginator<TEntity = any> extends BasePaginator implements IPaginator
{
  private readonly queryBuilder: SelectQueryBuilder<TEntity>;
  private transformFunction?: (entity: TEntity) => any;

  constructor(queryBuilder: SelectQueryBuilder<TEntity>, criteria: ICriteria)
  {
    super(criteria);
    this.queryBuilder = queryBuilder;
  }

  public setTransformFunction(fn: (entity: TEntity) => any): void
  {
    this.transformFunction = fn;
  }

  public async paginate<T = TEntity>(transformFn?: (entity: TEntity) => T): Promise<T[]>
  {
    this.total = await this.queryBuilder.getCount();

    this.addOrderBy();
    this.addPagination();

    const data = await this.queryBuilder.getMany();

    this.setPerPage(data.length);
    this.setCurrentPage();
    this.setLasPage();
    this.setFrom();
    this.setTo();

    // Usar transformFunction configurada o la provista como parámetro
    const finalTransformFn = transformFn || this.transformFunction;
    const transformedData = finalTransformFn ? data.map(finalTransformFn) : data;
    return transformedData as T[];
  }

  private addOrderByToBuilder(queryBuilder: SelectQueryBuilder<TEntity>): void
  {
    const sorts: Map<string, number | boolean | string> = this.sort.values();
    const alias = queryBuilder.alias;

    sorts.forEach((value: string, key: string) =>
    {
      const order: 'ASC' | 'DESC' = value.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      queryBuilder.addOrderBy(`${alias}.${key}`, order);
    });
  }

  private addOrderBy(): void
  {
    this.addOrderByToBuilder(this.queryBuilder);
  }

  private addPagination(): void
  {
    const exist = this.pagination.getExist();

    if (exist)
    {
      this.queryBuilder
        .offset(this.pagination.getOffset())
        .limit(this.pagination.getLimit());
    }
  }
}

export default TypeORMPaginator;
