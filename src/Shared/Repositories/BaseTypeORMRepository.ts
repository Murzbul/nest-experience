import { Injectable } from '@nestjs/common';
import { ICriteria } from '@shared/Criteria/ICriteria';
import { IPaginator } from '@shared/Criteria/IPaginator';
import IBaseDomain from '@shared/Entities/IBaseDomain';
import { ErrorException } from '@shared/Exceptions/ErrorException';
import { GeneralErrorType } from '@shared/Exceptions/GeneralErrorType';
import IBaseRepository from '@shared/Repositories/IBaseRepository';
import IByOptions from '@shared/Repositories/IByOptions';
import UnitOfWorkConstants from '@shared/UnitOfWork/UnitOfWorkConstants';
import { ClsService } from 'nestjs-cls';
import {
  DataSource,
  EntityManager,
  EntitySchema,
  Repository,
  QueryRunner,
  FindManyOptions,
  FindOneOptions
} from 'typeorm';

@Injectable()
abstract class BaseTypeORMRepository<T extends IBaseDomain> implements IBaseRepository<T>
{
  protected constructor(
    protected readonly cls: ClsService,
    protected readonly dataSource: DataSource,
    private readonly schema: EntitySchema<T>,
    private readonly entityName: string = 'entityName'
  )
  {}

  protected get readRepository(): Repository<T>
  {
    return this.dataSource.getRepository(this.schema);
  }

  // Repository para escrituras - respeta contexto transaccional si existe
  protected get writeRepository(): Repository<T>
  {
    const clsManager =
      this.cls.get<EntityManager>(UnitOfWorkConstants.MANAGER_KEY) ??
      this.cls.get<QueryRunner>(UnitOfWorkConstants.UNIT_OF_WORK_KEY)?.manager;

    // Si hay contexto transaccional, usarlo. Si no, usar DataSource normal
    const manager = clsManager ?? this.dataSource.manager;
    return manager.getRepository(this.schema);
  }

  // Compatibilidad hacia atrás - por defecto usa writeRepository para mantener comportamiento original
  protected get repository(): Repository<T>
  {
    return this.writeRepository;
  }

  async getOne(id: string, options: FindOneOptions<T> = { loadRelationIds: true }): Promise<T>
  {
    const entity = await this.readRepository.findOne({ where: { id }, ...(options as any) });

    if (!entity)
    {
      throw new ErrorException({
        message: `${this.entityName} not found.`,
        type: GeneralErrorType.NOT_FOUND,
        metadata: {
          context: 'Entity not found.',
          id
        }
      });
    }

    return entity;
  }

  async getOneBy(condition: Record<string, any>, opt: IByOptions = { initThrow: true, populate: undefined }): Promise<T | null>
  {
    const entity = await this.readRepository.findOne({ where: condition } as FindOneOptions<T>);

    if (opt?.initThrow && !entity)
    {
      throw new ErrorException({
        message: `${this.entityName} not found.`,
        type: GeneralErrorType.NOT_FOUND
      });
    }

    return entity;
  }

  async getBy(condition: Record<string, any>, opt: IByOptions = { initThrow: false, populate: undefined }): Promise<T[]>
  {
    const entities = await this.readRepository.find({ where: condition } as FindManyOptions<T>);

    if (opt?.initThrow && entities.length === 0)
    {
      throw new ErrorException({
        message: `${this.entityName} not found.`,
        type: GeneralErrorType.NOT_FOUND
      });
    }

    return entities;
  }

  async getInBy(condition: Record<string, string[]>): Promise<T[]>
  {
    const [key] = Object.keys(condition);

    const { In } = await import('typeorm');
    return await this.getBy({ [key]: In(condition[key]) } as unknown as Record<string, any>);
  }

  // Métodos de escritura
  async save(entity: T): Promise<T>
  {
    return await this.writeRepository.save(entity);
  }

  async update(entity: T): Promise<T>
  {
    return this.writeRepository.save(entity);
  }

  async delete(id: string): Promise<T>
  {
    const entity = await this.getOne(id);
    const result = await this.writeRepository.delete(id);

    if (!result.affected)
    {
      throw new ErrorException({
        message: 'Element not found.',
        type: GeneralErrorType.NOT_FOUND,
        metadata: {
          context: 'Entity not found',
          id
        }
      });
    }

    return entity;
  }

  abstract list(criteria: ICriteria): IPaginator;
}

export default BaseTypeORMRepository;
