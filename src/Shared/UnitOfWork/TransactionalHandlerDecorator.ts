import { TransactionHelper } from '@shared/UnitOfWork/TransactionHelper';

/**
 * Decorator that wraps a CQRS handler method within a database transaction.
 *
 * Usage:
 * ```typescript
 * @CommandHandler(MyCommand)
 * class MyHandler implements ICommandHandler<MyCommand> {
 *   constructor(private transactionHelper: TransactionHelper) {}
 *
 *   @TransactionalHandler
 *   async execute(command: MyCommand): Promise<any> {
 *     // Your logic here - will be executed within a transaction
 *     // If any error occurs, the transaction will be automatically rolled back
 *   }
 * }
 * ```
 *
 * Requires TransactionHelper to be injected as 'transactionHelper' in the handler.
 */
export function TransactionalHandler(target: any, propertyName: string, descriptor: PropertyDescriptor)
{
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[])
  {
    // Buscar el TransactionHelper en las propiedades de la instancia
    const transactionHelper: TransactionHelper = (this).transactionHelper;

    if (!transactionHelper)
    {
      throw new Error(
        `TransactionHelper not found in ${target.constructor.name}.${propertyName}(). ` +
        'Make sure to inject TransactionHelper in your handler constructor as "private transactionHelper: TransactionHelper".'
      );
    }

    // Execute the original method within a transaction
    return transactionHelper.executeInTransaction(async() =>
    {
      return await originalMethod.apply(this, args);
    });
  };

  // Preserve metadata from the original method
  Object.defineProperty(descriptor.value, 'name', { value: originalMethod.name });

  return descriptor;
}
