import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { questionsRouter } from './routes/questions.routes.js';
import { questionBankRouter } from './routes/questionBank.routes.js';
import { subjectsRouter } from './routes/subjects.routes.js';
import { chaptersRouter } from './routes/chapters.routes.js';
import { templatesRouter } from './routes/templates.routes.js';
import { symbolsRouter } from './routes/symbols.routes.js';
import { scienceRouter } from './routes/science.routes.js';
import { assetsRouter } from './routes/assets.routes.js';
import { papersRouter } from './routes/papers.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { attemptsRouter } from './routes/attempts.routes.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Healthcheck & Root Status Endpoints
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'EduForge API Server Running', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'EduForge API Server Running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Endpoints
app.use('/auth', authRouter);
app.use('/api/auth', authRouter);
app.use('/api/api/auth', authRouter);

// REST API Endpoints (Support multiple base paths for cPanel Passenger compatibility)
app.use('/questions', questionsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/api/questions', questionsRouter);

app.use('/question-bank', questionBankRouter);
app.use('/api/question-bank', questionBankRouter);
app.use('/api/api/question-bank', questionBankRouter);

app.use('/subjects', subjectsRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/api/subjects', subjectsRouter);

app.use('/chapters', chaptersRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/api/chapters', chaptersRouter);

app.use('/templates', templatesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/api/templates', templatesRouter);

app.use('/symbols', symbolsRouter);
app.use('/api/symbols', symbolsRouter);
app.use('/api/api/symbols', symbolsRouter);

app.use('/assets', assetsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/api/assets', assetsRouter);

app.use('/media', assetsRouter);
app.use('/api/media', assetsRouter);
app.use('/api/api/media', assetsRouter);

app.use('/papers', papersRouter);
app.use('/api/papers', papersRouter);
app.use('/api/api/papers', papersRouter);

app.use('/exam-papers', papersRouter);
app.use('/api/exam-papers', papersRouter);
app.use('/api/api/exam-papers', papersRouter);

app.use('/attempts', attemptsRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/api/attempts', attemptsRouter);

app.use('/test-attempts', attemptsRouter);
app.use('/api/test-attempts', attemptsRouter);
app.use('/api/api/test-attempts', attemptsRouter);

app.use('/settings', settingsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/api/settings', settingsRouter);

app.use('/', scienceRouter);
app.use('/api', scienceRouter);
app.use('/api/api', scienceRouter);

// Global Error Handler
app.use(errorHandler);
