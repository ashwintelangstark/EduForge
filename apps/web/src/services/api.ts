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

export const api = {
  // Papers & Documents
  getDocuments: papersApi.getDocuments.bind(papersApi),
  getDocument: papersApi.getDocument.bind(papersApi),
  createDocument: papersApi.createDocument.bind(papersApi),
  updateDocument: papersApi.updateDocument.bind(papersApi),
  duplicateDocument: papersApi.duplicateDocument.bind(papersApi),
  deleteDocument: papersApi.deleteDocument.bind(papersApi),
  exportDocx: papersApi.exportDocx.bind(papersApi),
  exportPdfHtml: papersApi.exportPdfHtml.bind(papersApi),

  // Test Attempt Logs
  getAttempts: attemptsApi.getAttempts.bind(attemptsApi),
  getAttempt: attemptsApi.getAttempt.bind(attemptsApi),
  createAttempt: attemptsApi.createAttempt.bind(attemptsApi),
  updateAttempt: attemptsApi.updateAttempt.bind(attemptsApi),
  deleteAttempt: attemptsApi.deleteAttempt.bind(attemptsApi),

  // Subjects & Chapters
  getSubjects: subjectsApi.getSubjects.bind(subjectsApi),
  createSubject: subjectsApi.createSubject.bind(subjectsApi),
  updateSubject: subjectsApi.updateSubject.bind(subjectsApi),
  deleteSubject: subjectsApi.deleteSubject.bind(subjectsApi),
  getChapters: chaptersApi.getChapters.bind(chaptersApi),
  createChapter: chaptersApi.createChapter.bind(chaptersApi),
  updateChapter: chaptersApi.updateChapter.bind(chaptersApi),
  deleteChapter: chaptersApi.deleteChapter.bind(chaptersApi),

  // Questions
  getQuestions: questionsApi.getQuestions.bind(questionsApi),
  getQuestionSummaries: questionsApi.getQuestionSummaries.bind(questionsApi),
  getQuestion: questionsApi.getQuestion.bind(questionsApi),
  createQuestion: questionsApi.createQuestion.bind(questionsApi),
  updateQuestion: questionsApi.updateQuestion.bind(questionsApi),
  duplicateQuestion: questionsApi.duplicateQuestion.bind(questionsApi),
  deleteQuestion: questionsApi.deleteQuestion.bind(questionsApi),
  deleteMultipleQuestions: questionsApi.deleteMultipleQuestions.bind(questionsApi),
  importQuestions: questionsApi.importQuestions.bind(questionsApi),
  getQuestionBankExportUrl: () => '/api/question-bank/export',

  // Templates
  getTemplates: templatesApi.getTemplates.bind(templatesApi),
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
