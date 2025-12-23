import { IMapCriteria } from '@shared/Criteria/IMapCriteria';
import { ParsedQs } from 'qs';

export abstract class MapCriteria implements IMapCriteria
{
    private readonly criterias: Map<string, string | number | boolean>;

    constructor(query: ParsedQs)
    {
        this.criterias = new Map<string, number | boolean | string>();
        const queryFilters: any = query ?? {};
        const defaults: any = this.getDefaults();
        const keys = this.getFields();

        defaults.forEach((defaultFilter: any) =>
        {
            const defaultKey: string = Object.keys(defaultFilter)[0];
            const defaultValue: string = defaultFilter[defaultKey];
            this.setValue(defaultKey, defaultValue);
        });
        const criterias = Object.keys(queryFilters).map((key: string) =>
        {
            const filter: Record<string, number | boolean | string> = query as Record<string, number | boolean | string>;
            let value = {};

            if (filter[key] !== undefined && filter[key] !== null)
            {
                value = {
                    [key]: filter[key]
                };
            }

            return value;
        }).filter((value =>
        {
            const key = Object.keys(value)[0];
            return keys.includes(key) ? value : false;
        }));

        criterias.forEach((newFilter: any) =>
        {
            const defaultKey: string = Object.keys(newFilter)[0];
            const defaultValue: string = newFilter[defaultKey];

            this.setValue(defaultKey, defaultValue);
        });
    }

    protected setValue(key: string, value: number | boolean | string)
    {
        if (value !== undefined && value !== null)
        {
            this.criterias.set(key, value);
        }
    }

    get(key: string, defaultValue?: number | boolean | string): number | boolean | string
    {
        return this.criterias.has(key) ? this.criterias.get(key) : defaultValue;
    }

    set(key: string, value: number | boolean | string): void
    {
        this.criterias.set(key as any, value);
    }

    has(key: string): boolean
    {
        return this.criterias.has(key);
    }

    isEmpty(): boolean
    {
        return this.criterias.size === 0;
    }

    getArray(): IterableIterator<[string, number | boolean | string]>
    {
        return this.criterias.entries();
    }

    values(): Map<string, number | boolean | string>
    {
        return this.criterias;
    }

    abstract getFields(): string[];
    abstract getDefaults(): Record<string, number | boolean | string>[];
}
