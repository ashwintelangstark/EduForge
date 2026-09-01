import { fetchApi } from './client.js';

export const chaptersApi = {
  async getChapters(subjectId?: string | number): Promise<any[]> {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    return fetchApi<any[]>(`/api/chapters${query}`);
  },

  async createChapter(subjectId: string | number, chapter: { title: string; name?: string; code?: string; subject?: string }): Promise<any> {
    return fetchApi<any>('/api/chapters', {
      method: 'POST',
      body: JSON.stringify({ subjectId, ...chapter })
    });
  },

  async updateChapter(id: string | number, chapter: { title: string; name?: string; code?: string; subject?: string; subjectId?: string }): Promise<any> {
    return fetchApi<any>(`/api/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chapter)
    });
  },

  async deleteChapter(id: string | number): Promise<void> {
    return fetchApi<void>(`/api/chapters/${id}`, {
      method: 'DELETE'
    });
  }
};
