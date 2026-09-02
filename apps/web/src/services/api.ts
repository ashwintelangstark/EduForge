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

// Helper with 2.5s timeout and automatic fallback
async function withFallback<T>(primaryFn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('API request timeout, switching to direct data engine')), 2500)
    );
    const result = await Promise.race([primaryFn(), timeoutPromise]);
    if (result && Array.isArray(result) && result.length === 0) {
      // If primary returned empty array, try fallback just in case
      const fallbackResult = await fallbackFn().catch(() => null);
      if (fallbackResult && Array.isArray(fallbackResult) && fallbackResult.length > 0) {
        return fallbackResult;
      }
    }
    return result;
  } catch (err) {
    console.warn('[EduForge Data Engine] Primary API failed/timed out, invoking Supabase direct layer:', err);
    return fallbackFn();
  }
}

export const api = {
  // Papers & Documents
  getDocuments: () => withFallback(() => papersApi.getDocuments(), () => supabaseDirect.getDocuments()),
  getDocument: (id: string) => withFallback(() => papersApi.getDocument(id), () => supabaseDirect.getDocument(id) as any),
  createDocument: (doc: any) => withFallback(() => papersApi.createDocument(doc), () => supabaseDirect.createDocument(doc)),
  updateDocument: (id: string, doc: any) => withFallback(() => papersApi.updateDocument(id, doc), () => supabaseDirect.updateDocument(id, doc)),
  duplicateDocument: papersApi.duplicateDocument.bind(papersApi),
  deleteDocument: (id: string) => withFallback(() => papersApi.deleteDocument(id), () => supabaseDirect.deleteDocument(id)),
  exportDocx: papersApi.exportDocx.bind(papersApi),
  exportPdfHtml: papersApi.exportPdfHtml.bind(papersApi),

  // Test Attempt Logs
  getAttempts: () => withFallback(() => attemptsApi.getAttempts(), () => supabaseDirect.getAttempts()),
  getAttempt: attemptsApi.getAttempt.bind(attemptsApi),
  createAttempt: attemptsApi.createAttempt.bind(attemptsApi),
  updateAttempt: attemptsApi.updateAttempt.bind(attemptsApi),
  deleteAttempt: attemptsApi.deleteAttempt.bind(attemptsApi),

  // Subjects & Chapters
  getSubjects: () => withFallback(() => subjectsApi.getSubjects(), () => supabaseDirect.getSubjects()),
  createSubject: (sub: any) => withFallback(() => subjectsApi.createSubject(sub), () => supabaseDirect.createSubject(sub)),
  updateSubject: (id: string, sub: any) => withFallback(() => subjectsApi.updateSubject(id, sub), () => supabaseDirect.updateSubject(id, sub)),
  deleteSubject: (id: string) => withFallback(() => subjectsApi.deleteSubject(id), () => supabaseDirect.deleteSubject(id)),
  getChapters: (subjectId?: string) => withFallback(() => chaptersApi.getChapters(subjectId), () => supabaseDirect.getChapters(subjectId)),
  createChapter: (subjectId: string, chapter: any) => withFallback(() => chaptersApi.createChapter(subjectId, chapter), () => supabaseDirect.createChapter(subjectId, chapter)),
  updateChapter: (id: string, chapter: any) => withFallback(() => chaptersApi.updateChapter(id, chapter), () => supabaseDirect.updateChapter(id, chapter)),
  deleteChapter: (id: string) => withFallback(() => chaptersApi.deleteChapter(id), () => supabaseDirect.deleteChapter(id)),

  // Questions
  getQuestions: (filters?: Record<string, any>) => withFallback(() => questionsApi.getQuestions(filters), () => supabaseDirect.getQuestions(filters)),
  getQuestionSummaries: (filters?: Record<string, any>) => withFallback(() => questionsApi.getQuestionSummaries(filters), () => supabaseDirect.getQuestions(filters)),
  getQuestion: (id: string) => withFallback(() => questionsApi.getQuestion(id), () => supabaseDirect.getQuestion(id) as any),
  createQuestion: (question: any) => withFallback(() => questionsApi.createQuestion(question), () => supabaseDirect.createQuestion(question)),
  updateQuestion: (id: string, question: any) => withFallback(() => questionsApi.updateQuestion(id, question), () => supabaseDirect.updateQuestion(id, question)),
  duplicateQuestion: questionsApi.duplicateQuestion.bind(questionsApi),
  deleteQuestion: (id: string) => withFallback(() => questionsApi.deleteQuestion(id), () => supabaseDirect.deleteQuestion(id)),
  deleteMultipleQuestions: (ids: string[]) => withFallback(() => questionsApi.deleteMultipleQuestions(ids), () => supabaseDirect.deleteMultipleQuestions(ids)),
  importQuestions: questionsApi.importQuestions.bind(questionsApi),
  getQuestionBankExportUrl: () => '/api/question-bank/export',

  // Templates
  getTemplates: () => withFallback(() => templatesApi.getTemplates(), () => supabaseDirect.getTemplates()),
  getTemplate: templatesApi.getTemplate.bind(templatesApi),
  createTemplate: templatesApi.createTemplate.bind(templatesApi),
  deleteTemplate: templatesApi.deleteTemplate.bind(templatesApi),

  // Assets & Media
  getMedia: assetsApi.getMedia.bind(assetsApi),
  uploadAsset: assetsApi.uploadAsset.bind(assetsApi),
  uploadImage: assetsApi.uploadImage.bind(assetsApi),
  deleteMedia: assetsApi.deleteMedia.bind(assetsApi),

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
