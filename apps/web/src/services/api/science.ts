import { PhysicsChapter, ChemistryElement, ChemistryNotation, Unit, ScientificConstant } from '@eduforge/shared';
import { fetchApi } from './client.js';
import defaultChapters from '../../../../../resources/physics/chapters.json';
import defaultElements from '../../../../../resources/chemistry/elements.json';
import defaultNotations from '../../../../../resources/chemistry/notations.json';
import defaultUnits from '../../../../../resources/units/units.json';
import defaultConstants from '../../../../../resources/constants/constants.json';

export const scienceApi = {
  async getPhysicsChapters(): Promise<PhysicsChapter[]> {
    try {
      const data = await fetchApi<PhysicsChapter[]>('/api/physics/chapters');
      return (data && data.length > 0) ? data : (defaultChapters as unknown as PhysicsChapter[]);
    } catch {
      return defaultChapters as unknown as PhysicsChapter[];
    }
  },

  async getChemistryElements(): Promise<ChemistryElement[]> {
    try {
      const data = await fetchApi<ChemistryElement[]>('/api/chemistry/elements');
      return (data && data.length > 0) ? data : (defaultElements as unknown as ChemistryElement[]);
    } catch {
      return defaultElements as unknown as ChemistryElement[];
    }
  },

  async getChemistryNotations(): Promise<ChemistryNotation[]> {
    try {
      const data = await fetchApi<ChemistryNotation[]>('/api/chemistry/notations');
      return (data && data.length > 0) ? data : (defaultNotations as unknown as ChemistryNotation[]);
    } catch {
      return defaultNotations as unknown as ChemistryNotation[];
    }
  },

  async getUnits(): Promise<Unit[]> {
    try {
      const data = await fetchApi<Unit[]>('/api/units');
      return (data && data.length > 0) ? data : (defaultUnits as unknown as Unit[]);
    } catch {
      return defaultUnits as unknown as Unit[];
    }
  },

  async getPrefixes(): Promise<any[]> {
    return (defaultUnits as any)?.prefixes || [];
  },

  async getConstants(): Promise<ScientificConstant[]> {
    try {
      const data = await fetchApi<ScientificConstant[]>('/api/constants');
      return (data && data.length > 0) ? data : (defaultConstants as unknown as ScientificConstant[]);
    } catch {
      return defaultConstants as unknown as ScientificConstant[];
    }
  }
};
