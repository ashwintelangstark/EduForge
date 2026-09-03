import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const questionsRouter = Router();

// GET /api/questions - Full question list with options
questionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
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

    let { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Resilient fallback: Query questions directly without schema cache joins
      try {
        let rawQuery = supabase.from('questions').select('*');
        if (difficulty && difficulty !== 'all') {
          rawQuery = rawQuery.eq('difficulty', difficulty as string);
        }
        if (search) {
          rawQuery = rawQuery.ilike('raw_text', `%${search}%`);
        }
        const { data: rawQuestions } = await rawQuery;
        if (rawQuestions && rawQuestions.length > 0) {
          const { data: rawOptions } = await supabase.from('question_options').select('*');
          data = rawQuestions.map((q: any) => ({
            ...q,
            question_options: (rawOptions || []).filter((opt: any) => opt.question_id === q.id)
          }));
        }
      } catch (fallbackErr) {
        console.warn('Fallback questions query warning:', fallbackErr);
      }
    }

    let formattedList = (data || []).map((q: any) => {
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

      const options = (q.question_options || []).map((opt: any) => {
        let textVal = opt.raw_text || '';
        if (!textVal && Array.isArray(opt.content)) {
          textVal = opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ');
        }
        return {
          id: opt.id,
          key: opt.option_key ? opt.option_key.toUpperCase() : 'A',
          option_key: opt.option_key || 'a',
          content: opt.content || [],
          rawText: textVal,
          isCorrect: (q.correct_option || '').toLowerCase() === (opt.option_key || '').toLowerCase()
        };
      });

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
        rawText: q.raw_text || '',
        diagramSvg: diagramSvg || undefined,
        diagramUrl: diagramUrl || undefined,
        imageUrl: diagramUrl || undefined,
        subject: q.subjects?.name || 'General',
        subject_name: q.subjects?.name || 'General',
        subjectId: q.subject_id,
        subject_id: q.subject_id,
        chapter: q.chapters?.title || 'General',
        chapter_name: q.chapters?.title || 'General',
        chapterId: q.chapter_id,
        chapter_id: q.chapter_id,
        options,
        createdAt: q.created_at,
        updatedAt: q.updated_at
      };
    });

    if (subject && subject !== 'all') {
      const subStr = String(subject).toLowerCase();
      formattedList = formattedList.filter((q: any) =>
        (q.subject || '').toLowerCase() === subStr ||
        (q.subject_name || '').toLowerCase() === subStr ||
        (q.subject || '').toLowerCase().includes(subStr) ||
        String(q.subject_id || '') === String(subject)
      );
    }

    if (chapter && chapter !== 'all') {
      const chStr = String(chapter).toLowerCase();
      formattedList = formattedList.filter((q: any) =>
        (q.chapter || '').toLowerCase() === chStr ||
        (q.chapter_name || '').toLowerCase() === chStr ||
        (q.chapter || '').toLowerCase().includes(chStr) ||
        String(q.chapter_id || '') === String(chapter)
      );
    }

    res.json({ success: true, data: formattedList });
  } catch (err) {
    next(err);
  }
});

// GET /api/questions/:id - Full Question detail
questionsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
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

    const options = (q.question_options || []).map((opt: any) => {
      let textVal = opt.raw_text || '';
      if (!textVal && Array.isArray(opt.content)) {
        textVal = opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ');
      }
      return {
        id: opt.id,
        key: opt.option_key ? opt.option_key.toUpperCase() : 'A',
        option_key: opt.option_key || 'a',
        rawText: textVal,
        content: opt.content || [],
        isCorrect: (q.correct_option || '').toLowerCase() === (opt.option_key || '').toLowerCase()
      };
    });

    const fullQuestion = {
      id: q.id,
      questionCode: q.question_code,
      question_code: q.question_code,
      questionType: q.question_type || 'MCQ_SINGLE',
      question_type: q.question_type || 'MCQ_SINGLE',
      content: q.content || [],
      explanation: q.explanation || [],
      explanationText: typeof q.explanation === 'string' ? q.explanation : (Array.isArray(q.explanation) ? q.explanation.map((e: any) => e.text || e.html || '').join(' ') : ''),
      difficulty: q.difficulty || 'Medium',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negative_marks) || 0,
      correctAnswer: (q.correct_option || 'a').toUpperCase(),
      correctOption: (q.correct_option || 'a').toLowerCase(),
      correct_option: (q.correct_option || 'a').toLowerCase(),
      optionLayout: q.option_layout || 'grid_2x2',
      year: q.year,
      source: q.source,
      rawText: q.raw_text || (Array.isArray(q.content) ? q.content.map((b: any) => b.text || b.html || '').join(' ') : ''),
      diagramSvg: diagramSvg || undefined,
      diagramUrl: diagramUrl || undefined,
      imageUrl: diagramUrl || undefined,
      subject: q.subjects?.name || 'General',
      chapter: q.chapters?.title || 'General',
      options,
      createdAt: q.created_at,
      updatedAt: q.updated_at
    };

    res.json({ success: true, data: fullQuestion });
  } catch (err) {
    next(err);
  }
});

// Helper to resolve or auto-create subject_id and chapter_id in Supabase
async function resolveSubjectAndChapter(subjectName?: string, chapterTitle?: string, directSubjectId?: string, directChapterId?: string) {
  let subject_id: string | null = null;
  let chapter_id: string | null = null;

  // 1. Check direct UUIDs if provided
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (directSubjectId && uuidRegex.test(String(directSubjectId).trim())) {
    subject_id = String(directSubjectId).trim();
  }
  if (directChapterId && uuidRegex.test(String(directChapterId).trim())) {
    chapter_id = String(directChapterId).trim();
  }

  // 2. Fetch all subjects for clean, safe in-memory matching
  const { data: allSubjects } = await supabase.from('subjects').select('id, name, code');
  if (subjectName && !subject_id) {
    const sTrim = String(subjectName).trim();
    const sLower = sTrim.toLowerCase();

    if (uuidRegex.test(sTrim)) {
      subject_id = sTrim;
    } else if (Array.isArray(allSubjects)) {
      const matchedSub = allSubjects.find(s =>
        s.id === sTrim ||
        (s.name || '').trim().toLowerCase() === sLower ||
        (s.code || '').trim().toLowerCase() === sLower ||
        sLower.includes((s.name || '').trim().toLowerCase()) ||
        (s.name || '').trim().toLowerCase().includes(sLower)
      );

      if (matchedSub) {
        subject_id = matchedSub.id;
      } else {
        const code = sTrim.substring(0, 3).toUpperCase();
        const { data: newSub } = await supabase
          .from('subjects')
          .insert({ name: sTrim, code, color: 'bg-teal-50 text-teal-700 border-teal-200' })
          .select('id')
          .maybeSingle();
        if (newSub?.id) subject_id = newSub.id;
      }
    }
  }

  // 3. Match or resolve chapter safely without PostgREST .or() comma-breaking bugs
  if (chapterTitle && !chapter_id) {
    const cTrim = String(chapterTitle).trim();
    const cLower = cTrim.toLowerCase();
    const cClean = cLower.replace(/[^a-z0-9]/g, '');

    if (uuidRegex.test(cTrim)) {
      chapter_id = cTrim;
    } else {
      let chQuery = supabase.from('chapters').select('id, title, chapter_code, subject_id');
      if (subject_id) {
        chQuery = chQuery.eq('subject_id', subject_id);
      }
      const { data: chaptersList } = await chQuery;

      if (Array.isArray(chaptersList) && chaptersList.length > 0) {
        const matched = chaptersList.find(c => {
          if (c.id === cTrim) return true;
          const tLower = (c.title || '').trim().toLowerCase();
          const codeLower = (c.chapter_code || '').trim().toLowerCase();
          if (tLower === cLower || codeLower === cLower) return true;
          const tClean = tLower.replace(/[^a-z0-9]/g, '');
          if (tClean && cClean && tClean === cClean) return true;
          return false;
        });

        if (matched) {
          chapter_id = matched.id;
          if (!subject_id && matched.subject_id) subject_id = matched.subject_id;
        }
      }

      // If still not matched, check across all chapters
      if (!chapter_id) {
        const { data: allChs } = await supabase.from('chapters').select('id, title, chapter_code, subject_id');
        if (Array.isArray(allChs)) {
          const matched = allChs.find(c => {
            if (c.id === cTrim) return true;
            const tLower = (c.title || '').trim().toLowerCase();
            const codeLower = (c.chapter_code || '').trim().toLowerCase();
            if (tLower === cLower || codeLower === cLower) return true;
            const tClean = tLower.replace(/[^a-z0-9]/g, '');
            if (tClean && cClean && tClean === cClean) return true;
            return false;
          });

          if (matched) {
            chapter_id = matched.id;
            if (!subject_id && matched.subject_id) subject_id = matched.subject_id;
          }
        }
      }

      // Only insert a brand new chapter if it truly does not exist in any format
      if (!chapter_id && subject_id) {
        const { data: newCh } = await supabase
          .from('chapters')
          .insert({
            subject_id,
            chapter_code: `CH-${Date.now().toString().slice(-4)}`,
            title: cTrim
          })
          .select('id')
          .maybeSingle();
        if (newCh?.id) chapter_id = newCh.id;
      }
    }
  }

  return { subject_id, chapter_id };
}

// Helper to insert options into Supabase with automatic schema fallback
async function saveQuestionOptions(questionId: string, options: any[]) {
  if (!Array.isArray(options) || options.length === 0) return;

  const formattedOpts = options.map((opt: any, idx: number) => {
    let rawVal = opt.rawText || '';
    if (!rawVal && Array.isArray(opt.content)) {
      rawVal = opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ');
    } else if (!rawVal && typeof opt.content === 'string') {
      rawVal = opt.content;
    }

    const contentBlocks = Array.isArray(opt.content) && opt.content.length > 0
      ? opt.content
      : [{ type: 'text', html: rawVal || '' }];

    return {
      question_id: questionId,
      option_key: (opt.key || String.fromCharCode(97 + idx)).toLowerCase(),
      content: contentBlocks,
      raw_text: rawVal,
      sort_order: idx + 1
    };
  });

  // Try inserting with raw_text
  const { error } = await supabase.from('question_options').insert(formattedOpts);
  if (error) {
    console.warn('Initial option insert failed, falling back to content-only insert:', error.message);
    const contentOnlyOpts = formattedOpts.map(({ raw_text, ...rest }) => rest);
    const { error: fallbackErr } = await supabase.from('question_options').insert(contentOnlyOpts);
    if (fallbackErr) {
      console.error('Failed inserting question options fallback:', fallbackErr);
    }
  }
}

// POST /api/questions - Create Question
questionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const { subject_id, chapter_id } = await resolveSubjectAndChapter(
      body.subject || body.subject_name,
      body.chapter || body.chapter_name,
      body.subjectId || body.subject_id,
      body.chapterId || body.chapter_id
    );

    let questionCode = body.questionCode;
    if (!questionCode || questionCode.startsWith('Q-') || questionCode === 'undefined') {
      const sub = (body.subject || 'BIO').trim().toLowerCase();
      let sCode = 'BIO';
      if (sub.includes('phys')) sCode = 'PHY';
      else if (sub.includes('chem')) sCode = 'CHE';
      else if (sub.includes('math')) sCode = 'MAT';
      else sCode = (body.subject || 'GEN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';

      const chClean = (body.chapter || 'GEN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
      const num = String(Math.floor(Math.random() * 9000) + 1000);
      questionCode = `${sCode}-${chClean.padEnd(3, 'X')}-${num}`;
    }
    const rawText = body.rawText || (Array.isArray(body.content) ? body.content.map((b: any) => b.text || b.html || '').join(' ') : '');

    // Duplicate question verification:
    // Check if a question with the identical statement already exists in the chapter/subject
    const cleanRaw = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (cleanRaw.length > 5) {
      let dupQuery = supabase
        .from('questions')
        .select('id, question_code, raw_text');

      if (chapter_id) {
        dupQuery = dupQuery.eq('chapter_id', chapter_id);
      } else if (subject_id) {
        dupQuery = dupQuery.eq('subject_id', subject_id);
      }

      const { data: existingList } = await dupQuery.limit(500);

      const exactDup = (existingList || []).find((eq: any) => {
        const eqClean = (eq.raw_text || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        return eqClean === cleanRaw;
      });

      if (exactDup) {
        return res.status(409).json({
          success: false,
          error: `Duplicate question detected! This question already exists in the question bank under code "${exactDup.question_code}". Duplicate questions are not allowed.`,
          code: 'DUPLICATE_QUESTION',
          existingCode: exactDup.question_code
        });
      }
    }

    let contentToSave = Array.isArray(body.content) ? [...body.content] : (Array.isArray(body.blocks) ? [...body.blocks] : []);
    if (body.diagramSvg && !contentToSave.some((b: any) => b.type === 'diagram' || b.diagramSvg || b.svg)) {
      contentToSave.push({ type: 'diagram', diagramSvg: body.diagramSvg, svg: body.diagramSvg });
    }
    if (body.imageUrl && !contentToSave.some((b: any) => b.type === 'image' || b.url || b.imageUrl)) {
      contentToSave.push({ type: 'image', url: body.imageUrl, imageUrl: body.imageUrl });
    }

    const insertPayload: any = {
      question_code: questionCode,
      subject_id,
      chapter_id,
      question_type: body.questionType || 'MCQ_SINGLE',
      content: contentToSave,
      explanation: body.explanation || body.explanationText || [],
      difficulty: body.difficulty || 'Medium',
      marks: body.marks || 1,
      negative_marks: body.negativeMarks || 0,
      correct_option: (body.correctAnswer || 'a').toLowerCase(),
      option_layout: body.optionLayout || 'grid_2x2',
      raw_text: rawText,
      year: body.year || null,
      source: body.source || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Only pass id if it is a valid UUID
    if (body.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) {
      insertPayload.id = body.id;
    }

    const { data: newQ, error } = await supabase
      .from('questions')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('Supabase create question insert error:', error);
      throw error;
    }

    // Save options if present
    if (Array.isArray(body.options) && body.options.length > 0) {
      await saveQuestionOptions(newQ.id, body.options);
    }

    res.status(201).json({ success: true, data: { ...body, id: newQ.id, questionCode } });
  } catch (err) {
    console.error('Create question route error:', err);
    next(err);
  }
});

// PUT /api/questions/:id - Update Question
questionsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const { subject_id, chapter_id } = await resolveSubjectAndChapter(
      body.subject || body.subject_name,
      body.chapter || body.chapter_name,
      body.subjectId || body.subject_id,
      body.chapterId || body.chapter_id
    );

    let contentToUpdate = Array.isArray(body.content) ? [...body.content] : (Array.isArray(body.blocks) ? [...body.blocks] : undefined);
    if (contentToUpdate) {
      if (body.diagramSvg && !contentToUpdate.some((b: any) => b.type === 'diagram' || b.diagramSvg || b.svg)) {
        contentToUpdate.push({ type: 'diagram', diagramSvg: body.diagramSvg, svg: body.diagramSvg });
      }
      if (body.imageUrl && !contentToUpdate.some((b: any) => b.type === 'image' || b.url || b.imageUrl)) {
        contentToUpdate.push({ type: 'image', url: body.imageUrl, imageUrl: body.imageUrl });
      }
    }

    const { error } = await supabase
      .from('questions')
      .update({
        subject_id: subject_id || undefined,
        chapter_id: chapter_id || undefined,
        content: contentToUpdate,
        explanation: body.explanation || body.explanationText,
        difficulty: body.difficulty,
        marks: body.marks,
        negative_marks: body.negativeMarks,
        correct_option: (body.correctAnswer || 'a').toLowerCase(),
        option_layout: body.optionLayout,
        raw_text: body.rawText,
        source: body.source !== undefined ? body.source : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    if (Array.isArray(body.options) && body.options.length > 0) {
      await supabase.from('question_options').delete().eq('question_id', String(id));
      await saveQuestionOptions(String(id), body.options);
    }

    res.json({ success: true, data: { ...body, id } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/questions/:id - Delete Question
questionsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await supabase.from('question_options').delete().eq('question_id', id);
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
