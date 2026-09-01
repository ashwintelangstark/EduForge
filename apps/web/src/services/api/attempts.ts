import { fetchApi } from './client.js';

export interface TestAttemptModel {
  id?: string;
  student: string;
  test: string;
  score: string;
  accuracy: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export const attemptsApi = {
  async getAttempts(): Promise<TestAttemptModel[]> {
    return fetchApi<TestAttemptModel[]>('/api/attempts');
  },

  async getAttempt(id: string): Promise<TestAttemptModel> {
    return fetchApi<TestAttemptModel>(`/api/attempts/${id}`);
  },

  async createAttempt(attempt: TestAttemptModel): Promise<TestAttemptModel> {
    return fetchApi<TestAttemptModel>('/api/attempts', {
      method: 'POST',
      body: JSON.stringify(attempt)
    });
  },

  async updateAttempt(id: string, attempt: TestAttemptModel): Promise<TestAttemptModel> {
    return fetchApi<TestAttemptModel>(`/api/attempts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attempt)
    });
  },

  async deleteAttempt(id: string): Promise<void> {
    return fetchApi<void>(`/api/attempts/${id}`, {
      method: 'DELETE'
    });
  }
};
