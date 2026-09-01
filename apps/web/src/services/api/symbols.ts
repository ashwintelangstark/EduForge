import { SymbolCategory } from '@eduforge/shared';
import { fetchApi } from './client.js';
import defaultSymbols from '../../../../../resources/symbols/symbols.json';

export const symbolsApi = {
  async getSymbols(): Promise<SymbolCategory[]> {
    try {
      const data = await fetchApi<SymbolCategory[]>('/api/symbols');
      return (data && data.length > 0) ? data : (defaultSymbols as unknown as SymbolCategory[]);
    } catch {
      return defaultSymbols as unknown as SymbolCategory[];
    }
  }
};
