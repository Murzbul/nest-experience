import { MapCriteria } from '@shared/Criteria/MapCriteria';
import { ParsedQs } from 'qs';

export abstract class SortCriteria extends MapCriteria
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

    // Filter queryFilters based on allowed keys (keys from getFields)
    const filteredQuery = Object.keys(queryFilters)
      .filter((key) => keys.includes(key)) // Only include allowed keys
      .reduce((acc, key) =>
      {
        acc[key] = queryFilters[key];
        return acc;
      }, {} as Record<string, any>);

    // Prioritize queryFilters over defaults
    if (Object.keys(filteredQuery).length > 0)
    {
      const firstKey = Object.keys(filteredQuery)[0];
      const firstValue = filteredQuery[firstKey] as string | number | boolean;
      this.setValue(firstKey, firstValue);
    }
    else if (defaults.length > 0)
    {
      const defaultRecord = defaults[0];
      const defaultKey = Object.keys(defaultRecord)[0];
      const defaultValue = defaultRecord[defaultKey];
      this.setValue(defaultKey, defaultValue);
    }
  }
}

export default SortCriteria;
