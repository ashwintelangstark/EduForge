import { DocumentModel } from '@eduforge/shared';
import { fetchApi } from './client.js';

export const papersApi = {
  async getDocuments(search?: string): Promise<DocumentModel[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchApi<DocumentModel[]>(`/api/papers${query}`);
  },

  async getDocument(id: string): Promise<DocumentModel> {
    return fetchApi<DocumentModel>(`/api/papers/${id}`);
  },

  async createDocument(doc: Partial<DocumentModel>): Promise<DocumentModel> {
    return fetchApi<DocumentModel>('/api/papers', {
      method: 'POST',
      body: JSON.stringify(doc)
    });
  },

  async updateDocument(id: string, doc: DocumentModel): Promise<DocumentModel> {
    return fetchApi<DocumentModel>(`/api/papers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doc)
    });
  },

  async duplicateDocument(id: string): Promise<DocumentModel> {
    const doc = await this.getDocument(id);
    const newDoc: Partial<DocumentModel> = {
      ...doc,
      title: `${doc.title} (Copy)`
    };
    delete (newDoc as any).id;
    return this.createDocument(newDoc);
  },

  async deleteDocument(id: string): Promise<void> {
    return fetchApi<void>(`/api/papers/${id}`, {
      method: 'DELETE'
    });
  },

  async exportDocx(doc: DocumentModel): Promise<Blob> {
    // Generate text/html blob fallback or call backend export endpoint
    const htmlContent = `<html><head><title>${doc.title}</title></head><body><h1>${doc.title}</h1></body></html>`;
    return new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  },

  async exportPdfHtml(doc: DocumentModel): Promise<string> {
    return `<!DOCTYPE html><html><head><title>${doc.title}</title></head><body style="font-family:sans-serif;padding:2rem;"><h1>${doc.title}</h1><p>Paper ID: ${doc.id}</p></body></html>`;
  }
};
