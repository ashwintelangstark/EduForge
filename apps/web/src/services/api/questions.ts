import { Question } from '@eduforge/shared';
import { fetchApi } from './client.js';

export const questionsApi = {
  async getQuestions(filters?: Record<string, any>): Promise<Question[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'all') {
          params.append(k, String(v));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<Question[]>(`/api/question-bank${query}`);
  },

  async getQuestionSummaries(filters?: Record<string, any>): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'all') {
          params.append(k, String(v));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<any[]>(`/api/questions${query}`);
  },

  async getQuestion(id: string): Promise<Question> {
    return fetchApi<Question>(`/api/questions/${id}`);
  },

  async createQuestion(question: Partial<Question>): Promise<Question> {
    return fetchApi<Question>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(question)
    });
  },

  async updateQuestion(id: string, question: Question): Promise<Question> {
    return fetchApi<Question>(`/api/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(question)
    });
  },

  async deleteQuestion(id: string): Promise<void> {
    return fetchApi<void>(`/api/questions/${id}`, {
      method: 'DELETE'
    });
  },

  async duplicateQuestion(id: string): Promise<Question> {
    const q = await this.getQuestion(id);
    const newQ: Partial<Question> = {
      ...q,
      rawText: `${q.rawText || ''} (Copy)`
    };
    delete (newQ as any).id;
    return this.createQuestion(newQ);
  },

  async deleteMultipleQuestions(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.deleteQuestion(id);
    }
  },

  async importQuestions(questions: Question[]): Promise<{ count: number }> {
    for (const q of questions) {
      await this.createQuestion(q);
    }
    return { count: questions.length };
  }
};
