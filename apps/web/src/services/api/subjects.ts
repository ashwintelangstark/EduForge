import { fetchApi } from './client.js';

export const subjectsApi = {
  async getSubjects(): Promise<any[]> {
    return fetchApi<any[]>('/api/subjects');
  },

  async createSubject(subject: { name: string; code: string; color?: string }): Promise<any> {
    return fetchApi<any>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(subject)
    });
  },

  async updateSubject(id: string | number, subject: { name: string; code: string; color?: string }): Promise<any> {
    return fetchApi<any>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subject)
    });
  },

  async deleteSubject(id: string | number): Promise<void> {
    return fetchApi<void>(`/api/subjects/${id}`, {
      method: 'DELETE'
    });
  }
};
