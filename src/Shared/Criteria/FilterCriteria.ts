import { MapCriteria } from '@shared/Criteria/MapCriteria';
import { ParsedQs } from 'qs';

export abstract class FilterCriteria extends MapCriteria
{
  constructor(query: ParsedQs)
  {
    super(query);
    this.processFilters(query);
  }

  private processFilters(query: ParsedQs): void
  {
    const queryFilters: any = query ?? {};
    const keys = this.getFields();
    const defaults = this.getDefaults();

    // Step 1: Add all default values to mergedFilters.
    defaults.forEach((defaultRecord) =>
    {
      const defaultKey = Object.keys(defaultRecord)[0];
      const defaultValue = defaultRecord[defaultKey];

      this.setValue(defaultKey, defaultValue);
    });

    // Step 2: Filter queryFilters based on allowed keys.
    const filteredQuery = Object.keys(queryFilters)
      .filter((key) => keys.includes(key)) // Only allowed keys
      .reduce((acc, key) =>
      {
        acc[key] = queryFilters[key];
        return acc;
      }, {} as Record<string, any>);

    // Step 3: Add each filtered value to criterias map.
    keys.forEach((key) =>
    {
      const currentValue = filteredQuery[key];

      if (currentValue !== undefined && currentValue !== null)
      {
        this.setValue(key, currentValue);
      }
    });
  }
}

export default FilterCriteria;
