import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const questionBankRouter = Router();

// GET /api/question-bank - Question Bank Listing
questionBankRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, chapter, difficulty, search } = req.query;

    let query = supabase
      .from('questions')
      .select('*, subjects(name), chapters(title), question_options(*)');

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty as string);
    }

    if (search) {
      query = query.ilike('raw_text', `%${search}%`);
    }

    const { data, error } = await query;

    if (error || !data) {
      return res.json({ success: true, data: [] });
    }

    const formatted = data.map((q: any) => {
      let diagramSvg: string | null = null;
      let diagramUrl: string | null = null;

      if (Array.isArray(q.content)) {
        for (const blk of q.content) {
          if (blk.diagramSvg || blk.svg) {
            diagramSvg = blk.diagramSvg || blk.svg;
          }
          if (blk.type === 'diagram' && (blk.diagramSvg || blk.svg)) {
            diagramSvg = blk.diagramSvg || blk.svg;
          }
          if (blk.type === 'image' && (blk.url || blk.src)) {
            diagramUrl = blk.url || blk.src;
          }
          if (blk.diagramUrl || blk.imageUrl || blk.url) {
            diagramUrl = blk.diagramUrl || blk.imageUrl || blk.url;
          }
        }
      }

      return {
        id: q.id,
        questionCode: q.question_code,
        question_code: q.question_code,
        questionType: q.question_type || 'MCQ_SINGLE',
        question_type: q.question_type || 'MCQ_SINGLE',
        content: q.content || [],
        explanation: q.explanation || [],
        difficulty: q.difficulty || 'Medium',
        marks: Number(q.marks) || 1,
        negativeMarks: Number(q.negative_marks) || 0,
        correctAnswer: (q.correct_option || 'a').toUpperCase(),
        correctOption: (q.correct_option || 'a').toLowerCase(),
        correct_option: (q.correct_option || 'a').toLowerCase(),
        optionLayout: q.option_layout || 'grid_2x2',
        year: q.year,
        source: q.source,
        subject: q.subjects?.name || 'General',
        subject_name: q.subjects?.name || 'General',
        subjectId: q.subject_id,
        subject_id: q.subject_id,
        chapter: q.chapters?.title || 'General',
        chapter_name: q.chapters?.title || 'General',
        chapterId: q.chapter_id,
        chapter_id: q.chapter_id,
        rawText: q.raw_text || '',
        diagramSvg: diagramSvg || undefined,
        diagramUrl: diagramUrl || undefined,
        imageUrl: diagramUrl || undefined,
        options: (q.question_options || []).map((opt: any) => ({
          id: opt.id,
          key: opt.option_key ? opt.option_key.toUpperCase() : 'A',
          option_key: opt.option_key || 'a',
          rawText: opt.raw_text || (Array.isArray(opt.content) ? opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ') : ''),
          content: opt.content || [],
          isCorrect: (q.correct_option || '').toLowerCase() === (opt.option_key || '').toLowerCase()
        })),
        createdAt: q.created_at,
        updatedAt: q.updated_at
      };
    });

    let filtered = formatted;
    const userSubject = (req.query.userSubject || req.headers['x-user-subject'] || 'All') as string;
    if (userSubject && userSubject !== 'All') {
      filtered = filtered.filter((q: any) => (q.subject || '').toLowerCase() === userSubject.toLowerCase());
    }

    if (subject && subject !== 'all') {
      const subStr = String(subject).toLowerCase();
      filtered = filtered.filter((q: any) =>
        (q.subject || '').toLowerCase() === subStr ||
        (q.subject_name || '').toLowerCase() === subStr ||
        String(q.subject_id || '') === String(subject)
      );
    }

    if (chapter && chapter !== 'all') {
      const chStr = String(chapter).toLowerCase();
      filtered = filtered.filter((q: any) =>
        (q.chapter || '').toLowerCase() === chStr ||
        (q.chapter_name || '').toLowerCase() === chStr ||
        String(q.chapter_id || '') === String(chapter)
      );
    }

    res.json({ success: true, data: filtered });
  } catch (err) {
    next(err);
  }
});

// GET /api/question-bank/:id
questionBankRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: q, error } = await supabase
      .from('questions')
      .select('*, subjects(name), chapters(title), question_options(*)')
      .eq('id', id)
      .single();

    if (error || !q) {
      return res.status(404).json({
        success: false,
        error: { code: 'QUESTION_NOT_FOUND', message: 'Question not found' }
      });
    }

    let diagramSvg: string | null = null;
    let diagramUrl: string | null = null;

    if (Array.isArray(q.content)) {
      for (const blk of q.content) {
        if (blk.diagramSvg || blk.svg) {
          diagramSvg = blk.diagramSvg || blk.svg;
        }
        if (blk.type === 'diagram' && (blk.diagramSvg || blk.svg)) {
          diagramSvg = blk.diagramSvg || blk.svg;
        }
        if (blk.type === 'image' && (blk.url || blk.src)) {
          diagramUrl = blk.url || blk.src;
        }
        if (blk.diagramUrl || blk.imageUrl || blk.url) {
          diagramUrl = blk.diagramUrl || blk.imageUrl || blk.url;
        }
      }
    }

    const formatted = {
      id: q.id,
      questionCode: q.question_code,
      question_code: q.question_code,
      questionType: q.question_type || 'MCQ_SINGLE',
      question_type: q.question_type || 'MCQ_SINGLE',
      content: q.content || [],
      explanation: q.explanation || [],
      difficulty: q.difficulty || 'Medium',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negative_marks) || 0,
      correctAnswer: (q.correct_option || 'a').toUpperCase(),
      correctOption: (q.correct_option || 'a').toLowerCase(),
      correct_option: (q.correct_option || 'a').toLowerCase(),
      optionLayout: q.option_layout || 'grid_2x2',
      year: q.year,
      source: q.source,
      subject: q.subjects?.name || 'General',
      chapter: q.chapters?.title || 'General',
      rawText: q.raw_text || '',
      diagramSvg: diagramSvg || undefined,
      diagramUrl: diagramUrl || undefined,
      imageUrl: diagramUrl || undefined,
      options: (q.question_options || []).map((opt: any) => ({
        id: opt.id,
        key: opt.option_key ? opt.option_key.toUpperCase() : 'A',
        option_key: opt.option_key || 'a',
        rawText: opt.raw_text || (Array.isArray(opt.content) ? opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ') : ''),
        content: opt.content || [],
        isCorrect: (q.correct_option || '').toLowerCase() === (opt.option_key || '').toLowerCase()
      })),
      createdAt: q.created_at,
      updatedAt: q.updated_at
    };

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});
