import ItemStatus from '@item/Domain/Enums/ItemStatus';
import ItemUpdatePayload from '@item/Domain/Payloads/ItemUpdatePayload';
import IItemRepository from '@item/Domain/Repositories/IItemRepository';
import ItemMetricsService from '@item/Domain/Services/ItemMetricsService';
import ItemStatusService from '@item/Domain/Services/ItemStatusService';
import ItemFactory from '@item/Infrastructure/Factories/ItemFactory';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { ErrorException } from '@shared/Exceptions/ErrorException';
import { GeneralErrorType } from '@shared/Exceptions/GeneralErrorType';
import ValidatedHandler from '@shared/Validations/ValidatedHandler';

import UpdateItemCommand from '../Commands/UpdateItemCommand';
import { ItemSchemaUpdateValidation } from '../Validations/ItemSchemaSaveValidation';

@CommandHandler(UpdateItemCommand)
class UpdateItemHandler extends ValidatedHandler<UpdateItemCommand, any> implements ICommandHandler<UpdateItemCommand>
{
    constructor(private repository: IItemRepository, private queryBus: QueryBus)
    {
        super(ItemSchemaUpdateValidation);
    }

    async execute(command: UpdateItemCommand): Promise<any>
    {
        const payload = await this.validate<ItemUpdatePayload>(command);

        // Verify item exists and get current state
        const existingItem = await this.repository.getOne(payload.id);

        // Validate item can be modified based on status
        this.validateCanModify(existingItem);

        // Cross-aggregate validation: Check for duplicate number if changed
        if (existingItem.number !== payload.number)
        {
            await this.validateUniqueNumber(payload.number, payload.id);
        }

        // Create a domain entity from payload with the existing ID
        const itemHeader = ItemFactory.fromPayload(payload, payload.id);
        // Set createdAt and updatedAt from the existing item
        itemHeader.createdAt = existingItem.createdAt;
        itemHeader.updatedAt = new Date().toISOString();

        // Business validation using domain service
        this.validateItemMetrics(itemHeader);

        // Update via repository
        return await this.repository.update(itemHeader);
    }

    /**
     * Validates that the item can be modified based on its status.
     * Uses ItemStatusService to enforce business rules.
     */
    private validateCanModify(item: any): void
    {
        // Calculate current status (in a real scenario, status would be stored)
        const currentStatus = ItemStatusService.calculateStatus(item);

        if (!ItemStatusService.canModify(currentStatus))
        {
            throw new ErrorException({
                message: `Cannot modify item with status: ${currentStatus}`,
                type: GeneralErrorType.VALIDATION_ERROR,
                metadata: {
                    itemId: item.id,
                    currentStatus,
                    reason: ItemStatusService.getStatusDescription(currentStatus)
                }
            });
        }
    }

    /**
     * Validates that the item number is unique (excluding current item).
     * This demonstrates cross-aggregate validation using QueryBus.
     */
    private async validateUniqueNumber(number: string, excludeId: string): Promise<void>
    {
        try
        {
            // Check if an item with this number already exists
            const existingItems = await this.repository.getBy({ number }, {});

            // Filter out the current item being updated
            const duplicates = existingItems.filter(item => item.id !== excludeId);

            if (duplicates.length > 0)
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

export default UpdateItemHandler;
