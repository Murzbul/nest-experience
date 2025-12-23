import { randomUUID } from 'crypto';

import { ItemDetailSchema } from '@src/Item/Infrastructure/Schemas/ItemDetailSchema';
import { ItemSchema } from '@src/Item/Infrastructure/Schemas/ItemSchema';
import { DataType, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';

export async function setupDataSource(): Promise<DataSource>
{
  const db = newDb();
  const ds: DataSource = db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [
      ItemSchema,
      ItemDetailSchema
    ],
    synchronize: true
  });

  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database'
  });

  db.registerExtension('uuid-ossp', (schema) =>
  {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: () => randomUUID(),
      impure: true
    });
  });

  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database'
  });

  db.public.registerFunction({
    name: 'gen_random_uuid',
    implementation: () => randomUUID(),
    impure: true
  });

  db.public.registerFunction({
    name: 'version',
    implementation: () => 'PostgreSQL 16'
  });

  await ds.initialize();

  return ds;
}
