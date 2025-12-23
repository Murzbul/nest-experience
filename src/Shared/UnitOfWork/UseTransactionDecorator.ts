import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { UseTransactionInterceptor } from '@shared/UnitOfWork/UseTransactionInterceptor';

export function UseTransaction()
{
  return applyDecorators(UseInterceptors(UseTransactionInterceptor));
}
