import { Template } from '@eduforge/shared';
import { fetchApi } from './client.js';
import defaultTemplates from '../../../../../resources/templates/templates.json';

export const templatesApi = {
  async getTemplates(): Promise<Template[]> {
    try {
      const data = await fetchApi<Template[]>('/api/templates');
      return (data && data.length > 0) ? data : (defaultTemplates as unknown as Template[]);
    } catch {
      return defaultTemplates as unknown as Template[];
    }
  },

  async getTemplate(id: string): Promise<Template> {
    try {
      return await fetchApi<Template>(`/api/templates/${id}`);
    } catch {
      const found = (defaultTemplates as unknown as Template[]).find(t => t.id === id);
      return found || (defaultTemplates[0] as unknown as Template);
    }
  },

  async createTemplate(template: Partial<Template>): Promise<Template> {
    return fetchApi<Template>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(template)
    });
  },

  async deleteTemplate(id: string): Promise<void> {
    return fetchApi<void>(`/api/templates/${id}`, { method: 'DELETE' });
  }
};
