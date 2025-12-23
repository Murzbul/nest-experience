# Migration Guide - TypeORM + DDD Pattern

## Overview

Este proyecto ha sido migrado de MongoDB/Mongoose a PostgreSQL/TypeORM siguiendo el patrón DDD (Domain-Driven Design) del proyecto Boris/core-api.

## Cambios Principales

### 1. Base de Datos

- **Antes**: MongoDB + Mongoose
- **Ahora**: PostgreSQL + TypeORM con EntitySchema

### 2. Patrón de Entidades

**Antes** (Mongoose/MongoDB):
```typescript
class Item extends BaseDomain {
  name: string;
  description: string;
}
```

**Ahora** (DDD con encapsulación):
```typescript
class ItemHeader extends BaseDomain implements IItemHeaderDomain {
  private readonly _number: string;
  private readonly _date: Date;
  private _customerName: string;
  private _totalAmount: number;
  private _details: ItemDetail[];

  get number(): string { return this._number; }
  get totalAmount(): number { return this._totalAmount; }

  addDetail(detail: ItemDetail): void {
    this._details.push(detail);
    this.recalculateTotal();
  }
}
```

### 3. Patrón Aggregate Root

ItemHeader actúa como **agregado raíz** que gestiona ItemDetail:
- ItemDetail NO se manipula directamente
- Todas las operaciones pasan por ItemHeader
- ItemHeader mantiene la consistencia (ej: totalAmount siempre correcto)

## Estructura del Módulo Item

```
src/Item/
├── Domain/
│   ├── Entities/
│   │   ├── ItemHeader.ts       # Aggregate root con lógica de negocio
│   │   └── ItemDetail.ts       # Entidad con encapsulación
│   ├── Payloads/
│   │   ├── ItemHeaderRepPayload.ts
│   │   └── ItemDetailRepPayload.ts
│   └── Repositories/
│       └── IItemRepository.ts
├── Application/
│   ├── Commands/
│   ├── Handlers/
│   │   └── SaveItemHandler.ts
│   └── Validations/
│       └── ItemSchemaSaveValidation.ts
├── Infrastructure/
│   ├── Schemas/
│   │   ├── ItemHeaderSchema.ts # TypeORM EntitySchema
│   │   └── ItemDetailSchema.ts # TypeORM EntitySchema
│   ├── Factories/
│   │   └── ItemHeaderFactory.ts # Conversión Domain ↔ Entity
│   └── Repositories/
│       └── ItemTypeORMRepository.ts
└── Presentation/
    └── Controllers/
        └── ItemController.ts
```

## Ejemplo de Uso

### Crear ItemHeader con detalles

**Request** `POST /api/items`:
```json
{
  "number": "INV-001",
  "date": "2025-11-26",
  "customerName": "John Doe",
  "details": [
    {
      "productName": "Laptop",
      "quantity": 2,
      "unitPrice": 1500.00
    },
    {
      "productName": "Mouse",
      "quantity": 5,
      "unitPrice": 25.00
    }
  ]
}
```

**Flujo interno**:
1. Validación con Zod schema
2. Factory crea entidad de dominio desde payload
3. Entidad calcula totalAmount automáticamente (3125.00)
4. Repository persiste header + details en transacción

### Lógica de Negocio Encapsulada

```typescript
// ItemDetail - Cálculo automático de subtotal
detail.updateQuantity(10); // Recalcula subtotal = quantity * unitPrice

// ItemHeader - Gestión del agregado
itemHeader.addDetail(newDetail); // Añade detalle y recalcula total
itemHeader.removeDetail(detailId); // Elimina detalle y recalcula total
```

## Infraestructura Shared

### UnitOfWork Pattern

```typescript
@UseTransaction() // Decorator para controllers
export class ItemController {
  @Post()
  async create(@Body() payload: any) {
    // Todo el flujo usa la misma transacción
    return await this.commandBus.execute(new SaveItemCommand(payload));
  }
}

// O manualmente en handlers
await this.transactionHelper.executeInTransaction(async () => {
  // Operaciones transaccionales
});
```

### BaseTypeORMRepository

- `writeRepository`: Para operaciones de escritura (usa transacciones si están activas)
- `readRepository`: Para consultas de lectura
- Integración automática con ClsModule para contexto asíncrono

### Paginación y Filtros

```typescript
const paginator = repository.list(criteria);
const items = await paginator.paginate<ItemHeaderRepPayload>();

// Configurar transformación personalizada
paginator.setTransformFunction((entity) => mapToDTO(entity));
```

## Estado Actual de la Migración

### ✅ Completado

- Docker + PostgreSQL configuración
- TypeORM DataSource y configuración
- ClsModule para async context
- Shared/ completo (Repositories, UnitOfWork, Pagination, Criteria)
- Item module con patrón ItemHeader/ItemDetail
- Entidades con encapsulación completa
- Schemas TypeORM
- Factory y Repository patterns
- Validaciones con Zod

### ⚠️ Pendiente

1. **File Module**: Migrar de Mongoose a TypeORM (actualmente deshabilitado)
2. **Auth Module**: Cambiar de Interceptor a Guard pattern
3. **Handlers restantes**: UpdateItemHandler, GetItemHandler, ListItemsHandler, RemoveItemHandler
4. **Tests**: Actualizar tests para TypeORM

## Patrones Clave

### 1. Factory Pattern

```typescript
// Payload → Domain
const itemHeader = ItemHeaderFactory.fromPayload(payload);

// Domain → TypeORM Entity
const headerEntity = ItemHeaderFactory.toEntity(itemHeader);

// TypeORM Entity → Domain
const itemHeader = ItemHeaderFactory.fromEntity(headerEntity, detailEntities);
```

### 2. Repository Pattern

```typescript
// Gestión del agregado completo
async save(itemHeader: ItemHeader): Promise<ItemHeader> {
  const headerEntity = ItemHeaderFactory.toEntity(itemHeader);
  const savedHeader = await this.writeRepository.save(headerEntity);

  const detailEntities = ItemHeaderFactory.detailsToEntities(itemHeader);
  await detailRepo.save(detailEntities);

  return ItemHeaderFactory.fromEntity(savedHeader, detailEntities);
}
```

### 3. Aggregate Root

- ItemHeader controla el ciclo de vida de ItemDetail
- Mantiene invariantes (totalAmount siempre correcto)
- Encapsula lógica de negocio

## Variables de Entorno

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=experience
DB_PASSWORD=experience
DB_NAME=experience
DB_SSL=false

# Filesystem (MinIO)
FILESYSTEM_PROTOCOL=http
FILESYSTEM_HOST=localhost
FILESYSTEM_PORT=9000
# ... resto de variables
```

## Comandos Útiles

```bash
# Iniciar servicios
docker-compose up -d

# Build
npm run build

# Dev mode
npm run start:dev

# Ver logs de PostgreSQL
docker logs experience_db_1

# Acceder a PostgreSQL
docker exec -it experience_db_1 psql -U experience -d experience
```

## Tablas Creadas

- `item_headers`: Headers con número único
- `item_details`: Detalles con FK a item_headers y índice

## Próximos Pasos

1. Migrar **File module** a TypeORM
2. Convertir Auth Interceptor a Guard
3. Completar handlers restantes de Item
4. Documentar patrones de testing con TypeORM
5. Considerar agregar foreign key constraint CASCADE en item_details
