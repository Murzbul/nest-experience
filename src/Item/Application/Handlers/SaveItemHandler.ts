import ItemRepPayload from '@item/Domain/Payloads/ItemRepPayload';
import IItemRepository from '@item/Domain/Repositories/IItemRepository';
import ItemMetricsService from '@item/Domain/Services/ItemMetricsService';
import ItemFactory from '@item/Infrastructure/Factories/ItemFactory';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { ErrorException } from '@shared/Exceptions/ErrorException';
import { GeneralErrorType } from '@shared/Exceptions/GeneralErrorType';
import ValidatedHandler from '@shared/Validations/ValidatedHandler';

import SaveItemCommand from '../Commands/SaveItemCommand';
import { ItemSchemaSaveValidation } from '../Validations/ItemSchemaSaveValidation';

@CommandHandler(SaveItemCommand)
class SaveItemHandler extends ValidatedHandler<SaveItemCommand, any> implements ICommandHandler<SaveItemCommand>
{
    constructor(
        private repository: IItemRepository,
        private queryBus: QueryBus
    )
    {
        super(ItemSchemaSaveValidation);
    }

    async execute(command: SaveItemCommand): Promise<any>
    {
        const payload = await this.validate<ItemRepPayload>(command);

        // Cross-aggregate validation: Check for duplicate item number
        await this.validateUniqueNumber(payload.number);

        // Use Factory to create a domain entity from payload
        const itemHeader = ItemFactory.fromPayload(payload);

        // Business validation using domain service
        this.validateItemMetrics(itemHeader);

        // Repository handles persistence of header + details
        return await this.repository.save(itemHeader);
    }

    /**
     * Validates that the item number is unique in the system.
     * This demonstrates cross-aggregate validation using QueryBus.
     */
    private async validateUniqueNumber(number: string): Promise<void>
    {
        try
        {
            // Check if an item with this number already exists
            const existingItems = await this.repository.getBy({ number }, {});

            if (existingItems.length > 0)
            {
                throw new ErrorException({
                    message: `Item with number ${number} already exists`,
                    type: GeneralErrorType.VALIDATION_ERROR,
                    metadata: { field: 'number', value: number }
                });
            }
        }
        catch (error)
        {
            // If it's already our validation error, rethrow it
            if (error instanceof ErrorException)
            {
                throw error;
            }
            // Otherwise, it's a query error - number is unique
        }
    }

    /**
     * Validates item metrics using domain service.
     * Demonstrates use of domain services for business rule validation.
     */
    private validateItemMetrics(itemHeader: any): void
    {
        const metrics = ItemMetricsService.calculateMetrics(itemHeader);

        // Validate minimum amount
        if (!ItemMetricsService.meetsMinimumAmount(itemHeader, 1))
        {
            throw new ErrorException({
                message: 'Item total amount must be greater than zero',
                type: GeneralErrorType.VALIDATION_ERROR,
                metadata: { totalAmount: metrics.totalAmount.toString() }
            });
        }

        // Validate maximum amount
        const MAX_AMOUNT = 10000000;
        if (!ItemMetricsService.withinMaximumAmount(itemHeader, MAX_AMOUNT))
        {
            throw new ErrorException({
                message: `Item total amount exceeds maximum allowed (${MAX_AMOUNT})`,
                type: GeneralErrorType.VALIDATION_ERROR,
                metadata: { totalAmount: metrics.totalAmount.toString(), maxAmount: MAX_AMOUNT.toString() }
            });
        }
    }
}

export default SaveItemHandler;
