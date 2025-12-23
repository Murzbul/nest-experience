import { SetMetadata } from '@nestjs/common';

export const SKIP_UNIT_OF_WORK_KEY = 'skip_unit_of_work';
export const SkipUnitOfWork = () => SetMetadata(SKIP_UNIT_OF_WORK_KEY, true);
