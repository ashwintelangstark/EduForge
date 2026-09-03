import { questionsApi } from './api/questions.js';
import { papersApi } from './api/papers.js';
import { subjectsApi } from './api/subjects.js';
import { chaptersApi } from './api/chapters.js';
import { templatesApi } from './api/templates.js';
import { assetsApi } from './api/assets.js';
import { symbolsApi } from './api/symbols.js';
import { scienceApi } from './api/science.js';
import { settingsApi } from './api/settings.js';
import { attemptsApi } from './api/attempts.js';
import { supabaseDirect } from './supabaseDirect.js';
import { apiCache } from './apiCache.js';

// Fast parallel resolution helper with 1.2s timeout
async function withFallback<T>(primaryFn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('API request timeout, switching to direct data engine')), 1200)
    );
    const result = await Promise.race([primaryFn(), timeoutPromise]);
    if (result && Array.isArray(result) && result.length === 0) {
      const fallbackResult = await fallbackFn().catch(() => null);
      if (fallbackResult && Array.isArray(fallbackResult) && fallbackResult.length > 0) {
        return fallbackResult;
      }
    }
    return result;
  } catch (err) {
    return fallbackFn();
  }
}

export const api = {
  // Papers & Documents
  getDocuments: () => apiCache.fetchWithCache('documents', () => withFallback(() => papersApi.getDocuments(), () => supabaseDirect.getDocuments())),
  getDocument: (id: string) => withFallback(() => papersApi.getDocument(id), () => supabaseDirect.getDocument(id) as any),
  createDocument: async (doc: any) => {
    apiCache.invalidate('documents');
    return withFallback(() => papersApi.createDocument(doc), () => supabaseDirect.createDocument(doc));
  },
  updateDocument: async (id: string, doc: any) => {
    apiCache.invalidate('documents');
    return withFallback(() => papersApi.updateDocument(id, doc), () => supabaseDirect.updateDocument(id, doc));
  },
  duplicateDocument: async (id: string) => {
    apiCache.invalidate('documents');
    return papersApi.duplicateDocument(id);
  },
  deleteDocument: async (id: string) => {
    apiCache.invalidate('documents');
    return withFallback(() => papersApi.deleteDocument(id), () => supabaseDirect.deleteDocument(id));
  },
  exportDocx: papersApi.exportDocx.bind(papersApi),
  exportPdfHtml: papersApi.exportPdfHtml.bind(papersApi),

  // Test Attempt Logs
  getAttempts: () => apiCache.fetchWithCache('attempts', () => withFallback(() => attemptsApi.getAttempts(), () => supabaseDirect.getAttempts())),
  getAttempt: attemptsApi.getAttempt.bind(attemptsApi),
  createAttempt: (doc: any) => attemptsApi.createAttempt(doc),
  updateAttempt: (id: string, doc: any) => attemptsApi.updateAttempt(id, doc),
  deleteAttempt: (id: string) => attemptsApi.deleteAttempt(id),

  // Subjects & Chapters
  getSubjects: () => apiCache.fetchWithCache('subjects', () => withFallback(() => subjectsApi.getSubjects(), () => supabaseDirect.getSubjects()), 120000),
  createSubject: async (sub: any) => {
    apiCache.invalidate('subjects');
    return withFallback(() => subjectsApi.createSubject(sub), () => supabaseDirect.createSubject(sub));
  },
  updateSubject: async (id: string, sub: any) => {
    apiCache.invalidate('subjects');
    return withFallback(() => subjectsApi.updateSubject(id, sub), () => supabaseDirect.updateSubject(id, sub));
  },
  deleteSubject: async (id: string) => {
    apiCache.invalidate('subjects');
    return withFallback(() => subjectsApi.deleteSubject(id), () => supabaseDirect.deleteSubject(id));
  },
  getChapters: (subjectId?: string) => apiCache.fetchWithCache(`chapters-${subjectId || 'all'}`, () => withFallback(() => chaptersApi.getChapters(subjectId), () => supabaseDirect.getChapters(subjectId)), 120000),
  createChapter: async (subjectId: string, chapter: any) => {
    apiCache.invalidate('chapters');
    return withFallback(() => chaptersApi.createChapter(subjectId, chapter), () => supabaseDirect.createChapter(subjectId, chapter));
  },
  updateChapter: async (id: string, chapter: any) => {
    apiCache.invalidate('chapters');
    return withFallback(() => chaptersApi.updateChapter(id, chapter), () => supabaseDirect.updateChapter(id, chapter));
  },
  deleteChapter: async (id: string) => {
    apiCache.invalidate('chapters');
    return withFallback(() => chaptersApi.deleteChapter(id), () => supabaseDirect.deleteChapter(id));
  },

  // Questions
  getQuestions: (filters?: Record<string, any>, forceRefresh = false) => {
    const key = `questions-${JSON.stringify(filters || {})}`;
    return apiCache.fetchWithCache(key, () => withFallback(() => questionsApi.getQuestions(filters), () => supabaseDirect.getQuestions(filters)), 10000, forceRefresh);
  },
  getQuestionSummaries: (filters?: Record<string, any>, forceRefresh = false) => {
    const key = `qsummaries-${JSON.stringify(filters || {})}`;
    return apiCache.fetchWithCache(key, () => withFallback(() => questionsApi.getQuestionSummaries(filters), () => supabaseDirect.getQuestions(filters)), 10000, forceRefresh);
  },
  getQuestion: (id: string) => withFallback(() => questionsApi.getQuestion(id), () => supabaseDirect.getQuestion(id) as any),
  createQuestion: async (question: any) => {
    apiCache.invalidate('questions');
    apiCache.invalidate('qsummaries');
    apiCache.invalidate('media');
    return withFallback(() => questionsApi.createQuestion(question), () => supabaseDirect.createQuestion(question));
  },
  updateQuestion: async (id: string, question: any) => {
    apiCache.invalidate('questions');
    apiCache.invalidate('qsummaries');
    apiCache.invalidate('media');
    return withFallback(() => questionsApi.updateQuestion(id, question), () => supabaseDirect.updateQuestion(id, question));
  },
  duplicateQuestion: async (id: string) => {
    apiCache.invalidate('questions');
    apiCache.invalidate('qsummaries');
    apiCache.invalidate('media');
    return questionsApi.duplicateQuestion(id);
  },
  deleteQuestion: async (id: string) => {
    apiCache.invalidate('questions');
    apiCache.invalidate('qsummaries');
    apiCache.invalidate('media');
    return withFallback(() => questionsApi.deleteQuestion(id), () => supabaseDirect.deleteQuestion(id));
  },
  deleteMultipleQuestions: async (ids: string[]) => {
    apiCache.invalidate('questions');
    apiCache.invalidate('qsummaries');
    apiCache.invalidate('media');
    return withFallback(() => questionsApi.deleteMultipleQuestions(ids), () => supabaseDirect.deleteMultipleQuestions(ids));
  },
  importQuestions: async (data: any) => {
    apiCache.invalidate('questions');
    apiCache.invalidate('qsummaries');
    apiCache.invalidate('media');
    return questionsApi.importQuestions(data);
  },
  getQuestionBankExportUrl: () => '/api/question-bank/export',

  // Templates
  getTemplates: (forceRefresh = false) => apiCache.fetchWithCache('templates', () => withFallback(() => templatesApi.getTemplates(), () => supabaseDirect.getTemplates()), 30000, forceRefresh),
  getTemplate: templatesApi.getTemplate.bind(templatesApi),
  createTemplate: (t: any) => templatesApi.createTemplate(t),
  deleteTemplate: (id: string) => templatesApi.deleteTemplate(id),

  // Assets & Media
  getMedia: (subject?: string, forceRefresh = false) => apiCache.fetchWithCache(`media-${subject || 'all'}`, () => withFallback(() => assetsApi.getMedia(subject), () => supabaseDirect.getMedia(subject)), 10000, forceRefresh),
  uploadAsset: async (file: File, subject?: string) => {
    apiCache.invalidate('media');
    return withFallback(() => assetsApi.uploadAsset(file, subject), () => supabaseDirect.uploadAsset(file, subject));
  },
  uploadImage: async (file: File, subject?: string) => {
    apiCache.invalidate('media');
    return withFallback(() => assetsApi.uploadImage(file, subject), () => supabaseDirect.uploadAsset(file, subject));
  },
  deleteMedia: async (id: string) => {
    apiCache.invalidate('media');
    return withFallback(() => assetsApi.deleteMedia(id), () => supabaseDirect.deleteMedia(id));
  },

  // Symbols & Science
  getSymbols: symbolsApi.getSymbols.bind(symbolsApi),
  getPhysicsChapters: scienceApi.getPhysicsChapters.bind(scienceApi),
  getChemistryElements: scienceApi.getChemistryElements.bind(scienceApi),
  getChemistryNotations: scienceApi.getChemistryNotations.bind(scienceApi),
  getUnits: scienceApi.getUnits.bind(scienceApi),
  getPrefixes: scienceApi.getPrefixes.bind(scienceApi),
  getConstants: scienceApi.getConstants.bind(scienceApi),

  // Settings
  getSettings: settingsApi.getSettings.bind(settingsApi),
  updateSettings: settingsApi.updateSettings.bind(settingsApi)
};
