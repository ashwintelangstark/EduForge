import { createClient } from '@supabase/supabase-js';
import { Question, DocumentModel } from '@eduforge/shared';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bsbbyuaqibehvcbwugif.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYmJ5dWFxaWJlaHZjYnd1Z2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgyNjM4OSwiZXhwIjoyMTAzNDAyMzg5fQ.vcEJqHNWfCMoPRRkNs6bvNKTeMI9x4HYmzEE8bXkZgU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

function mapDbQuestionToModel(q: any): Question {
  let diagramSvg: string | null = null;
  let diagramUrl: string | null = null;

  if (Array.isArray(q.content)) {
    for (const blk of q.content) {
      if (blk.diagramSvg || blk.svg) diagramSvg = blk.diagramSvg || blk.svg;
      if (blk.type === 'diagram' && (blk.diagramSvg || blk.svg)) diagramSvg = blk.diagramSvg || blk.svg;
      if (blk.type === 'image' && (blk.url || blk.src)) diagramUrl = blk.url || blk.src;
      if (blk.diagramUrl || blk.imageUrl || blk.url) diagramUrl = blk.diagramUrl || blk.imageUrl || blk.url;
    }
  }

  let explanationText = '';
  if (typeof q.explanation === 'string') {
    explanationText = q.explanation;
  } else if (Array.isArray(q.explanation)) {
    explanationText = q.explanation.map((e: any) => e.text || e.html || '').join(' ');
  }

  return {
    id: q.id,
    questionCode: q.question_code,
    question_code: q.question_code,
    questionType: q.question_type || 'MCQ_SINGLE',
    question_type: q.question_type || 'MCQ_SINGLE',
    content: q.content || [],
    explanation: q.explanation || [],
    explanationText: explanationText,
    difficulty: q.difficulty || 'Medium',
    marks: Number(q.marks) || 4,
    negativeMarks: Number(q.negative_marks) !== undefined ? Number(q.negative_marks) : 1,
    correctAnswer: (q.correct_option || 'a').toUpperCase(),
    correctOption: (q.correct_option || 'a').toLowerCase(),
    correct_option: (q.correct_option || 'a').toLowerCase(),
    optionLayout: q.option_layout || 'grid_2x2',
    year: q.year,
    source: q.source,
    subject: q.subject || q.subject_name || q.subjects?.name || 'General',
    subject_name: q.subject_name || q.subject || q.subjects?.name || 'General',
    subjectId: q.subject_id || q.subjectId,
    subject_id: q.subject_id || q.subjectId,
    chapter: q.chapter || q.chapter_name || q.chapters?.title || 'General',
    chapter_name: q.chapter_name || q.chapter || q.chapters?.title || 'General',
    chapterId: q.chapter_id || q.chapterId,
    chapter_id: q.chapter_id || q.chapterId,
    rawText: q.raw_text || (Array.isArray(q.content) ? q.content.map((c: any) => c.text || c.html || (c.latex ? `\\(${c.latex}\\)` : '')).join(' ') : (typeof q.content === 'string' ? q.content : '')),
    diagramSvg: diagramSvg || undefined,
    diagramUrl: diagramUrl || undefined,
    imageUrl: diagramUrl || undefined,
    options: (q.question_options || []).map((opt: any, idx: number) => ({
      id: opt.id,
      key: opt.option_key ? opt.option_key.toUpperCase() : String.fromCharCode(65 + idx),
      option_key: opt.option_key || String.fromCharCode(97 + idx),
      rawText: opt.raw_text || (Array.isArray(opt.content) ? opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ') : ''),
      content: opt.content || [],
      isCorrect: (q.correct_option || '').toLowerCase() === (opt.option_key || String.fromCharCode(97 + idx)).toLowerCase()
    })),
    createdAt: q.created_at,
    updatedAt: q.updated_at
  } as unknown as Question;
}

export const supabaseDirect = {
  // Questions
  async getQuestions(filters?: Record<string, any>): Promise<Question[]> {
    try {
      let query = supabase
        .from('questions')
        .select('*, subjects(name), chapters(title), question_options(*)');

      if (filters?.difficulty && filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty);
      }
      if (filters?.search) {
        query = query.ilike('raw_text', `%${filters.search}%`);
      }

      let { data, error } = await query;
      if (error || !data || data.length === 0) {
        try {
          let rawQuery = supabase.from('questions').select('*');
          if (filters?.difficulty && filters.difficulty !== 'all') {
            rawQuery = rawQuery.eq('difficulty', filters.difficulty);
          }
          if (filters?.search) {
            rawQuery = rawQuery.ilike('raw_text', `%${filters.search}%`);
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
          console.warn('[SupabaseDirect] getQuestions fallback error:', fallbackErr);
        }
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(mapDbQuestionToModel);
    } catch (err) {
      console.error('[SupabaseDirect] getQuestions exception:', err);
      return [];
    }
  },

  async getQuestion(id: string): Promise<Question | null> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*, subjects(name), chapters(title), question_options(*)')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return mapDbQuestionToModel(data);
    } catch {
      return null;
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    await supabase.from('question_options').delete().eq('question_id', id);
    await supabase.from('questions').delete().eq('id', id);
  },

  async deleteMultipleQuestions(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    await supabase.from('question_options').delete().in('question_id', ids);
    await supabase.from('questions').delete().in('id', ids);
  },

  async createQuestion(question: Partial<Question>): Promise<Question> {
    const cleanQ = await processAndUploadQuestionImagesDirect(question);
    const rawText = cleanQ.rawText || (Array.isArray(cleanQ.content) ? cleanQ.content.map((b: any) => b.text || b.html || '').join(' ') : '');
    let questionCode = (cleanQ as any).questionCode || (cleanQ as any).question_code;
    if (!questionCode || questionCode.startsWith('Q-') || questionCode === 'undefined') {
      const sub = (cleanQ.subject || 'BIO').trim().toUpperCase().substring(0, 3);
      const chClean = (cleanQ.chapter || 'GEN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
      const num = String(Math.floor(Math.random() * 9000) + 1000);
      questionCode = `${sub}-${chClean.padEnd(3, 'X')}-${num}`;
    }

    let subject_id = (cleanQ as any).subjectId || (cleanQ as any).subject_id || null;
    let chapter_id = (cleanQ as any).chapterId || (cleanQ as any).chapter_id || null;

    // Resolve subject_id if missing
    if (!subject_id && cleanQ.subject) {
      const { data: subs } = await supabase.from('subjects').select('id, name').ilike('name', cleanQ.subject).maybeSingle();
      if (subs?.id) subject_id = subs.id;
    }
    // Resolve chapter_id if missing
    if (!chapter_id && cleanQ.chapter) {
      let chQuery = supabase.from('chapters').select('id, title').ilike('title', cleanQ.chapter);
      if (subject_id) chQuery = chQuery.eq('subject_id', subject_id);
      const { data: chs } = await chQuery.maybeSingle();
      if (chs?.id) chapter_id = chs.id;
    }

    let contentToSave: any[] = Array.isArray(cleanQ.content) ? [...cleanQ.content] : [];
    if (cleanQ.diagramSvg && !contentToSave.some((b: any) => b.type === 'diagram' || b.diagramSvg || b.svg)) {
      contentToSave.push({ type: 'diagram', diagramSvg: cleanQ.diagramSvg, svg: cleanQ.diagramSvg });
    }
    if (cleanQ.imageUrl && !contentToSave.some((b: any) => b.type === 'image' || b.url || b.imageUrl)) {
      contentToSave.push({ type: 'image', url: cleanQ.imageUrl, imageUrl: cleanQ.imageUrl } as any);
    }

    const insertPayload: any = {
      question_code: questionCode,
      subject_id,
      chapter_id,
      question_type: cleanQ.questionType || 'MCQ_SINGLE',
      content: contentToSave,
      explanation: cleanQ.explanation || (cleanQ as any).explanationText || [],
      difficulty: cleanQ.difficulty || 'Medium',
      marks: Number(cleanQ.marks) || 4,
      negative_marks: Number(cleanQ.negativeMarks) !== undefined ? Number(cleanQ.negativeMarks) : 1,
      correct_option: (cleanQ.correctAnswer || (cleanQ as any).correctOption || 'A').toLowerCase(),
      option_layout: cleanQ.optionLayout || 'grid_2x2',
      raw_text: rawText,
      year: cleanQ.year || null,
      source: cleanQ.source || 'saved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (cleanQ.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQ.id)) {
      insertPayload.id = cleanQ.id;
    }

    const { data: newQ, error } = await supabase
      .from('questions')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error || !newQ) {
      console.error('[SupabaseDirect] createQuestion insert error:', error);
      throw error || new Error('Failed to create question in Supabase');
    }

    // Save Options
    if (Array.isArray(cleanQ.options) && cleanQ.options.length > 0) {
      const formattedOpts = cleanQ.options.map((opt: any, idx: number) => {
        let rawVal = opt.rawText || '';
        if (!rawVal && Array.isArray(opt.content)) {
          rawVal = opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ');
        }
        return {
          question_id: newQ.id,
          option_key: (opt.key || String.fromCharCode(65 + idx)).toLowerCase(),
          content: Array.isArray(opt.content) && opt.content.length > 0 ? opt.content : [{ type: 'text', html: rawVal || '' }],
          raw_text: rawVal,
          sort_order: idx + 1
        };
      });
      await supabase.from('question_options').insert(formattedOpts);
    }

    // Auto-sync images into media library
    syncQuestionImagesToAssetsDirect(newQ.id, cleanQ).catch(() => {});

    return { ...cleanQ, id: newQ.id, questionCode } as Question;
  },

  async updateQuestion(id: string, question: Partial<Question>): Promise<Question> {
    const cleanQ = await processAndUploadQuestionImagesDirect(question);
    const rawText = cleanQ.rawText || (Array.isArray(cleanQ.content) ? cleanQ.content.map((b: any) => b.text || b.html || '').join(' ') : '');
    const qAny = cleanQ as any;
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };
    if (cleanQ.questionCode) updatePayload.question_code = cleanQ.questionCode;
    if (qAny.subjectId || qAny.subject_id) updatePayload.subject_id = qAny.subjectId || qAny.subject_id;
    if (qAny.chapterId || qAny.chapter_id) updatePayload.chapter_id = qAny.chapterId || qAny.chapter_id;
    if (question.questionType) updatePayload.question_type = question.questionType;
    if (question.content) updatePayload.content = question.content;
    if (question.difficulty) updatePayload.difficulty = question.difficulty;
    if (question.marks !== undefined) updatePayload.marks = Number(question.marks);
    if (question.negativeMarks !== undefined) updatePayload.negative_marks = Number(question.negativeMarks);
    if (question.correctAnswer) updatePayload.correct_option = question.correctAnswer.toLowerCase();
    if (question.optionLayout) updatePayload.option_layout = question.optionLayout;
    if (rawText) updatePayload.raw_text = rawText;
    if (question.explanation || (question as any).explanationText) {
      updatePayload.explanation = question.explanation || (question as any).explanationText;
    }
    if (qAny.source !== undefined) updatePayload.source = qAny.source;
    if (qAny.year !== undefined) updatePayload.year = qAny.year;

    // Resolve subject_id if name passed
    if (!updatePayload.subject_id && qAny.subject) {
      const { data: sub } = await supabase.from('subjects').select('id').ilike('name', qAny.subject).maybeSingle();
      if (sub?.id) updatePayload.subject_id = sub.id;
    }
    // Resolve chapter_id if name passed
    if (!updatePayload.chapter_id && qAny.chapter) {
      let chQuery = supabase.from('chapters').select('id').ilike('title', qAny.chapter);
      if (updatePayload.subject_id) chQuery = chQuery.eq('subject_id', updatePayload.subject_id);
      const { data: ch } = await chQuery.maybeSingle();
      if (ch?.id) updatePayload.chapter_id = ch.id;
    }

    const { error } = await supabase.from('questions').update(updatePayload).eq('id', id);
    if (error) {
      console.error('[SupabaseDirect] updateQuestion error:', error);
      throw error;
    }

    if (Array.isArray(question.options) && question.options.length > 0) {
      await supabase.from('question_options').delete().eq('question_id', id);
      const formattedOpts = question.options.map((opt: any, idx: number) => {
        let rawVal = opt.rawText || '';
        if (!rawVal && Array.isArray(opt.content)) {
          rawVal = opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ');
        }
        return {
          question_id: id,
          option_key: (opt.key || String.fromCharCode(65 + idx)).toLowerCase(),
          content: Array.isArray(opt.content) && opt.content.length > 0 ? opt.content : [{ type: 'text', html: rawVal || '' }],
          raw_text: rawVal,
          sort_order: idx + 1
        };
      });
      await supabase.from('question_options').insert(formattedOpts);
    }

    // Auto-sync images into media library
    syncQuestionImagesToAssetsDirect(id, question).catch(() => {});

    return { ...question, id } as Question;
  },

  // Subjects & Chapters
  async getSubjects(): Promise<any[]> {
    try {
      const [subsRes, chsRes, qsRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('chapters').select('id, subject_id'),
        supabase.from('questions').select('id, subject_id')
      ]);

      if (subsRes.error || !subsRes.data) return [];
      const subjects = subsRes.data;
      const chapters = chsRes.data || [];
      const questions = qsRes.data || [];

      return subjects.map((s: any) => {
        const sId = String(s.id || '').toLowerCase();
        const chCount = chapters.filter((c: any) => String(c.subject_id || '').toLowerCase() === sId).length;
        const qCount = questions.filter((q: any) => String(q.subject_id || '').toLowerCase() === sId).length;
        return {
          id: s.id,
          name: s.name,
          code: s.code,
          color: s.color || 'bg-slate-50 text-slate-700 border-slate-200',
          chapters: chCount,
          questions: qCount,
          status: 'Active'
        };
      });
    } catch {
      return [];
    }
  },

  async createSubject(sub: any): Promise<any> {
    const payload = {
      name: sub.name,
      code: sub.code || sub.name.substring(0, 3).toUpperCase(),
      color: sub.color || 'bg-slate-50 text-slate-700 border-slate-200'
    };
    const { data, error } = await supabase.from('subjects').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateSubject(id: string, sub: any): Promise<any> {
    const payload: any = {};
    if (sub.name) payload.name = sub.name;
    if (sub.code) payload.code = sub.code;
    if (sub.color) payload.color = sub.color;
    const { data, error } = await supabase.from('subjects').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSubject(id: string): Promise<void> {
    await supabase.from('subjects').delete().eq('id', id);
  },

  async getChapters(subjectId?: string): Promise<any[]> {
    try {
      let query = supabase.from('chapters').select('*, subjects(name)').order('title');
      if (subjectId && subjectId !== 'all') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(subjectId)) {
          query = query.eq('subject_id', subjectId);
        } else {
          // If subject name like 'Physics' was passed, find its UUID
          const { data: sub } = await supabase.from('subjects').select('id').ilike('name', subjectId).maybeSingle();
          if (sub?.id) {
            query = query.eq('subject_id', sub.id);
          }
        }
      }
      const [chaptersRes, questionsRes] = await Promise.all([
        query,
        supabase.from('questions').select('id, chapter_id, subject_id')
      ]);

      if (chaptersRes.error || !chaptersRes.data) return [];
      const chapters = chaptersRes.data;
      const questions = questionsRes.data || [];

      return chapters.map((c: any) => {
        const cId = String(c.id || '').toLowerCase();
        const qCount = questions.filter((q: any) => String(q.chapter_id || '').toLowerCase() === cId).length;
        return {
          id: c.id,
          title: c.title,
          name: c.title,
          code: c.chapter_code || `CH-${String(c.id).slice(-4)}`,
          chapter_code: c.chapter_code,
          subject_id: c.subject_id,
          subject_name: c.subjects?.name || '',
          subject: c.subjects?.name || '',
          count: qCount,
          questions_count: qCount
        };
      });
    } catch {
      return [];
    }
  },

  async createChapter(subjectId: string, chapter: any): Promise<any> {
    let resolvedSubId = subjectId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(subjectId)) {
      const { data: sub } = await supabase.from('subjects').select('id').ilike('name', subjectId).maybeSingle();
      if (sub?.id) resolvedSubId = sub.id;
    }
    const payload = {
      subject_id: resolvedSubId,
      chapter_code: chapter.code || `CH-${Date.now().toString().slice(-4)}`,
      title: chapter.title || chapter.name
    };
    const { data, error } = await supabase.from('chapters').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateChapter(id: string, chapter: any): Promise<any> {
    const payload: any = {};
    if (chapter.title || chapter.name) payload.title = chapter.title || chapter.name;
    if (chapter.code) payload.chapter_code = chapter.code;
    const { data, error } = await supabase.from('chapters').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteChapter(id: string): Promise<void> {
    await supabase.from('chapters').delete().eq('id', id);
  },

  // Papers / Documents
  async getDocuments(): Promise<DocumentModel[]> {
    try {
      const { data, error } = await supabase.from('papers').select('*').order('updated_at', { ascending: false });
      if (error || !data) return [];
      return data.map((p: any) => ({
        id: p.id,
        title: p.title || 'Untitled Paper',
        templateId: p.template_id || 'a4-single-column',
        metadata: p.metadata || {},
        settings: p.settings || {},
        sections: p.sections || [],
        createdAt: p.created_at,
        updatedAt: p.updated_at
      } as unknown as DocumentModel));
    } catch {
      return [];
    }
  },

  async getDocument(id: string): Promise<DocumentModel | null> {
    try {
      const { data, error } = await supabase.from('papers').select('*').eq('id', id).single();
      if (error || !data) return null;
      return {
        id: data.id,
        title: data.title || 'Untitled Paper',
        templateId: data.template_id || 'a4-single-column',
        metadata: data.metadata || {},
        settings: data.settings || {},
        sections: data.sections || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as unknown as DocumentModel;
    } catch {
      return null;
    }
  },

  async createDocument(doc: Partial<DocumentModel>): Promise<DocumentModel> {
    const payload = {
      title: doc.title || 'Untitled Paper',
      template_id: doc.templateId || 'a4-single-column',
      metadata: doc.metadata || {},
      settings: doc.settings || {},
      sections: doc.sections || []
    };
    const { data, error } = await supabase.from('papers').insert(payload).select().single();
    if (error || !data) throw error || new Error('Failed to create paper');
    return {
      id: data.id,
      title: data.title,
      templateId: data.template_id,
      metadata: data.metadata,
      settings: data.settings,
      sections: data.sections,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as unknown as DocumentModel;
  },

  async updateDocument(id: string, doc: Partial<DocumentModel>): Promise<DocumentModel> {
    const payload = {
      title: doc.title,
      template_id: doc.templateId,
      metadata: doc.metadata,
      settings: doc.settings,
      sections: doc.sections,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('papers').update(payload).eq('id', id).select().single();
    if (error || !data) throw error || new Error('Failed to update paper');
    return {
      id: data.id,
      title: data.title,
      templateId: data.template_id,
      metadata: data.metadata,
      settings: data.settings,
      sections: data.sections,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as unknown as DocumentModel;
  },

  async deleteDocument(id: string): Promise<void> {
    await supabase.from('papers').delete().eq('id', id);
  },

  // Templates
  async getTemplates(): Promise<any[]> {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  // Attempts
  async getAttempts(): Promise<any[]> {
    try {
      const { data, error } = await supabase.from('test_attempts').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  // Assets & Media Library
  async getMedia(subject?: string): Promise<any[]> {
    try {
      const BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'question-assets';
      const assetsList: any[] = [];
      const folders = ['', 'biology', 'physics', 'chemistry', 'mathematics', 'general', 'uploads', 'questions'];

      // 1. Scan Database assets table
      const { data: dbData } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (dbData && dbData.length > 0) {
        dbData.forEach((a: any) => {
          const publicUrl = a.public_url || '';
          if (publicUrl) {
            assetsList.push({
              id: a.id,
              name: a.filename || 'Untitled Asset',
              filename: a.filename,
              label: (a.storage_path && a.storage_path.includes('/')) ? a.storage_path.split('/')[0].toUpperCase() : 'FIGURE',
              url: publicUrl,
              public_url: publicUrl,
              storagePath: a.storage_path,
              mimeType: a.mime_type || 'image/png',
              sizeBytes: a.size_bytes || 0,
              usesCount: 0,
              createdAt: a.created_at
            });
          }
        });
      }

      // 2. Scan Supabase storage bucket folders & root
      for (const folder of folders) {
        try {
          const { data: files } = await supabase.storage.from(BUCKET_NAME).list(folder, { limit: 100 });
          if (files && files.length > 0) {
            for (const f of files) {
              if (f.name && f.name !== '.emptyFolderPlaceholder') {
                const storagePath = folder ? `${folder}/${f.name}` : f.name;
                const existsInDb = assetsList.some(a => a.storagePath === storagePath || (a.url && a.url.includes(f.name)));
                if (!existsInDb) {
                  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
                  assetsList.push({
                    id: `storage-${folder || 'root'}-${f.name}`,
                    name: f.name,
                    filename: f.name,
                    label: folder ? folder.toUpperCase() : 'FIGURE',
                    url: urlData.publicUrl,
                    public_url: urlData.publicUrl,
                    storagePath,
                    mimeType: 'image/png',
                    sizeBytes: f.metadata?.size || 0,
                    usesCount: 0,
                    createdAt: f.created_at || new Date().toISOString()
                  });
                }
              }
            }
          }
        } catch {}
      }

      // 3. Scan questions table for attached images, diagrams, raw_text images, and options
      try {
        const { data: qData } = await supabase
          .from('questions')
          .select('id, question_code, image_url, diagram_url, content, raw_text, question_options(id, option_key, content, raw_text)');
        if (qData && qData.length > 0) {
          qData.forEach((q: any, idx: number) => {
            const imgUrls: Array<{ url: string; label: string; name: string }> = [];
            if (q.image_url) imgUrls.push({ url: q.image_url, label: 'QUESTION IMAGE', name: `Question ${q.question_code || idx + 1} Image` });
            if (q.diagram_url) imgUrls.push({ url: q.diagram_url, label: 'QUESTION DIAGRAM', name: `Question ${q.question_code || idx + 1} Diagram` });

            if (Array.isArray(q.content)) {
              q.content.forEach((blk: any) => {
                const u = blk.url || blk.src || blk.imageUrl || blk.diagramUrl;
                if (u) imgUrls.push({ url: u, label: 'QUESTION BLOCK', name: `Question ${q.question_code || idx + 1} Figure` });
              });
            }

            if (typeof q.raw_text === 'string') {
              const matches = q.raw_text.match(/<img[^>]*src=["']([^"']+)["']/gi);
              if (matches) {
                matches.forEach((m: string) => {
                  const srcMatch = m.match(/src=["']([^"']+)["']/i);
                  if (srcMatch && srcMatch[1]) {
                    imgUrls.push({ url: srcMatch[1], label: 'STATEMENT IMAGE', name: `Question ${q.question_code || idx + 1} Statement Image` });
                  }
                });
              }
            }

            if (Array.isArray(q.question_options)) {
              q.question_options.forEach((opt: any) => {
                if (Array.isArray(opt.content)) {
                  opt.content.forEach((blk: any) => {
                    const u = blk.url || blk.src || blk.imageUrl;
                    if (u) imgUrls.push({ url: u, label: 'OPTION FIGURE', name: `Question ${q.question_code || idx + 1} Option ${opt.option_key?.toUpperCase()} Image` });
                  });
                }
                if (typeof opt.raw_text === 'string') {
                  const matches = opt.raw_text.match(/<img[^>]*src=["']([^"']+)["']/gi);
                  if (matches) {
                    matches.forEach((m: string) => {
                      const srcMatch = m.match(/src=["']([^"']+)["']/i);
                      if (srcMatch && srcMatch[1]) {
                        imgUrls.push({ url: srcMatch[1], label: 'OPTION FIGURE', name: `Question ${q.question_code || idx + 1} Option ${opt.option_key?.toUpperCase()} Image` });
                      }
                    });
                  }
                }
              });
            }

            imgUrls.forEach((img, uIdx) => {
              if (img.url && (img.url.startsWith('http') || img.url.startsWith('data:') || img.url.startsWith('/')) && !assetsList.some(a => a.url === img.url)) {
                assetsList.push({
                  id: `q-img-${q.id || idx}-${uIdx}`,
                  name: img.name,
                  filename: img.name,
                  label: img.label,
                  url: img.url,
                  public_url: img.url,
                  storagePath: '',
                  mimeType: 'image/png',
                  sizeBytes: 0,
                  usesCount: 1,
                  createdAt: new Date().toISOString()
                });
              }
            });
          });
        }
      } catch (qErr) {
        console.warn('[SupabaseDirect] Questions image scan note:', qErr);
      }

      if (subject && subject !== 'All' && subject !== 'all') {
        const subLower = subject.toLowerCase().trim();
        return assetsList.filter(a => {
          const pathLower = (a.storagePath || '').toLowerCase();
          const nameLower = (a.name || '').toLowerCase();
          const urlLower = (a.url || '').toLowerCase();
          return pathLower.includes(subLower) || nameLower.includes(subLower) || urlLower.includes(subLower);
        });
      }

      return assetsList;
    } catch (err) {
      console.error('[SupabaseDirect] getMedia error:', err);
      return [];
    }
  },

  async uploadAsset(file: File, subject?: string): Promise<{ id: string; url: string; originalName: string }> {
    const BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'question-assets';
    const folder = (subject || 'general').toLowerCase().trim();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `${folder}/${fileName}`;

    let publicUrl = '';
    const { data: storageData, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, { upsert: true });

    if (!storageError && storageData) {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      publicUrl = urlData.publicUrl;
    } else {
      // Data URL fallback if storage is unconfigured
      publicUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    // Save record into assets table
    let assetId = `asset-${Date.now()}`;
    try {
      const { data: dbData } = await supabase
        .from('assets')
        .insert({
          storage_path: storagePath,
          public_url: publicUrl,
          filename: file.name,
          mime_type: file.type || 'image/png',
          size_bytes: file.size
        })
        .select('id')
        .maybeSingle();
      if (dbData?.id) assetId = dbData.id;
    } catch (dbErr) {
      console.warn('[SupabaseDirect] asset table insert note:', dbErr);
    }

    return {
      id: assetId,
      url: publicUrl,
      originalName: file.name
    };
  },

  async deleteMedia(id: string): Promise<void> {
    try {
      const { data: asset } = await supabase.from('assets').select('storage_path').eq('id', id).maybeSingle();
      if (asset?.storage_path) {
        const BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'question-assets';
        await supabase.storage.from(BUCKET_NAME).remove([asset.storage_path]);
      }
      await supabase.from('assets').delete().eq('id', id);
    } catch (err) {
      console.warn('[SupabaseDirect] deleteMedia error:', err);
    }
  }
};

// Upload a base64 Data URL to Supabase Storage bucket
async function uploadBase64ToStorageDirect(base64Str: string, subject?: string, name?: string): Promise<{ publicUrl: string; storagePath: string } | null> {
  if (!base64Str || !base64Str.startsWith('data:image/')) return null;
  try {
    const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches) return null;
    const mimeType = matches[1] || 'image/png';
    const byteCharacters = atob(matches[2]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const ext = mimeType.split('/')[1] || 'png';
    const folder = (subject || 'general').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_') || 'general';
    const fileName = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const storagePath = `${folder}/${fileName}`;

    const BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'question-assets';
    const { data: storageData, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, blob, { contentType: mimeType, upsert: true });

    if (!storageError && storageData) {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      // Insert into assets table
      try {
        await supabase.from('assets').insert({
          storage_path: storagePath,
          public_url: publicUrl,
          filename: name || fileName,
          mime_type: mimeType,
          size_bytes: blob.size
        });
      } catch (assetErr) {
        console.warn('[uploadBase64ToStorageDirect] assets insert notice:', assetErr);
      }

      return { publicUrl, storagePath };
    }
  } catch (err) {
    console.warn('[uploadBase64ToStorageDirect] error:', err);
  }
  return null;
}

// Helper to convert any base64 images into permanent Supabase storage public URLs before saving
async function processAndUploadQuestionImagesDirect(question: any): Promise<any> {
  const processed = { ...question };
  const sub = processed.subject || processed.subject_name || 'general';

  // 1. Process imageUrl
  if (processed.imageUrl && processed.imageUrl.startsWith('data:image/')) {
    const res = await uploadBase64ToStorageDirect(processed.imageUrl, sub, `Question ${processed.questionCode || 'Asset'} Image`);
    if (res?.publicUrl) {
      processed.imageUrl = res.publicUrl;
      processed.diagramUrl = res.publicUrl;
    }
  }

  // 2. Process diagramUrl
  if (processed.diagramUrl && processed.diagramUrl.startsWith('data:image/')) {
    const res = await uploadBase64ToStorageDirect(processed.diagramUrl, sub, `Question ${processed.questionCode || 'Asset'} Diagram`);
    if (res?.publicUrl) {
      processed.diagramUrl = res.publicUrl;
      if (!processed.imageUrl) processed.imageUrl = res.publicUrl;
    }
  }

  // 3. Process rawText for <img src="data:image/...">
  if (typeof processed.rawText === 'string' && processed.rawText.includes('data:image/')) {
    const matches = processed.rawText.match(/<img[^>]*src=["'](data:image\/[^"']+)["']/gi);
    if (matches) {
      for (const m of matches) {
        const srcMatch = m.match(/src=["'](data:image\/[^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          const res = await uploadBase64ToStorageDirect(srcMatch[1], sub, `Statement Image`);
          if (res?.publicUrl) {
            processed.rawText = processed.rawText.replace(srcMatch[1], res.publicUrl);
          }
        }
      }
    }
  }

  // 4. Process content blocks
  if (Array.isArray(processed.content)) {
    const newContent = [];
    for (const b of processed.content) {
      const bCopy = { ...b };
      const u = bCopy.url || bCopy.imageUrl || bCopy.src;
      if (u && u.startsWith('data:image/')) {
        const res = await uploadBase64ToStorageDirect(u, sub, `Block Image`);
        if (res?.publicUrl) {
          bCopy.url = res.publicUrl;
          bCopy.imageUrl = res.publicUrl;
          if (bCopy.src) bCopy.src = res.publicUrl;
        }
      }
      if (typeof bCopy.html === 'string' && bCopy.html.includes('data:image/')) {
        const matches = bCopy.html.match(/<img[^>]*src=["'](data:image\/[^"']+)["']/gi);
        if (matches) {
          for (const m of matches) {
            const srcMatch = m.match(/src=["'](data:image\/[^"']+)["']/i);
            if (srcMatch && srcMatch[1]) {
              const res = await uploadBase64ToStorageDirect(srcMatch[1], sub, `Block HTML Image`);
              if (res?.publicUrl) {
                bCopy.html = bCopy.html.replace(srcMatch[1], res.publicUrl);
              }
            }
          }
        }
      }
      newContent.push(bCopy);
    }
    processed.content = newContent;
  }

  // 5. Process options
  if (Array.isArray(processed.options)) {
    const newOpts = [];
    for (let i = 0; i < processed.options.length; i++) {
      const opt = { ...processed.options[i] };
      if (opt.imageUrl && opt.imageUrl.startsWith('data:image/')) {
        const res = await uploadBase64ToStorageDirect(opt.imageUrl, sub, `Option ${opt.key || String.fromCharCode(65 + i)} Image`);
        if (res?.publicUrl) {
          opt.imageUrl = res.publicUrl;
        }
      }
      if (typeof opt.rawText === 'string' && opt.rawText.includes('data:image/')) {
        const matches = opt.rawText.match(/<img[^>]*src=["'](data:image\/[^"']+)["']/gi);
        if (matches) {
          for (const m of matches) {
            const srcMatch = m.match(/src=["'](data:image\/[^"']+)["']/i);
            if (srcMatch && srcMatch[1]) {
              const res = await uploadBase64ToStorageDirect(srcMatch[1], sub, `Option ${opt.key || String.fromCharCode(65 + i)} Image`);
              if (res?.publicUrl) {
                opt.rawText = opt.rawText.replace(srcMatch[1], res.publicUrl);
              }
            }
          }
        }
      }
      newOpts.push(opt);
    }
    processed.options = newOpts;
  }

  return processed;
}

// Helper to automatically register attached images into the assets media library
async function syncQuestionImagesToAssetsDirect(questionId: string, question: any) {
  try {
    const urls: Array<{ url: string; name?: string }> = [];
    const qAny = question as any;

    if (qAny.imageUrl && (qAny.imageUrl.startsWith('http') || qAny.imageUrl.startsWith('data:'))) {
      urls.push({ url: qAny.imageUrl, name: `Question ${qAny.questionCode || questionId} Image` });
    }
    if (qAny.diagramUrl && (qAny.diagramUrl.startsWith('http') || qAny.diagramUrl.startsWith('data:'))) {
      urls.push({ url: qAny.diagramUrl, name: `Question ${qAny.questionCode || questionId} Diagram` });
    }

    const raw = qAny.rawText || '';
    if (typeof raw === 'string') {
      const matches = raw.match(/<img[^>]*src=["']([^"']+)["']/gi);
      if (matches) {
        matches.forEach((m: string) => {
          const srcMatch = m.match(/src=["']([^"']+)["']/i);
          if (srcMatch && (srcMatch[1].startsWith('http') || srcMatch[1].startsWith('data:'))) {
            urls.push({ url: srcMatch[1], name: `Question ${qAny.questionCode || questionId} Statement Image` });
          }
        });
      }
    }

    if (Array.isArray(qAny.content)) {
      qAny.content.forEach((b: any) => {
        const u = b.url || b.imageUrl || b.src;
        if (u && (u.startsWith('http') || u.startsWith('data:'))) {
          urls.push({ url: u, name: `Question ${qAny.questionCode || questionId} Block Image` });
        }
      });
    }

    if (Array.isArray(qAny.options)) {
      qAny.options.forEach((o: any, idx: number) => {
        const u = o.imageUrl;
        if (u && (u.startsWith('http') || u.startsWith('data:'))) {
          urls.push({ url: u, name: `Option ${o.key || String.fromCharCode(65 + idx)} Image` });
        }
        if (typeof o.rawText === 'string') {
          const matches = o.rawText.match(/<img[^>]*src=["']([^"']+)["']/gi);
          if (matches) {
            matches.forEach((m: string) => {
              const srcMatch = m.match(/src=["']([^"']+)["']/i);
              if (srcMatch && (srcMatch[1].startsWith('http') || srcMatch[1].startsWith('data:'))) {
                urls.push({ url: srcMatch[1], name: `Option ${o.key || String.fromCharCode(65 + idx)} Image` });
              }
            });
          }
        }
      });
    }

    const uniqueUrls = urls.filter((item, index, self) => index === self.findIndex(t => t.url === item.url));

    for (const item of uniqueUrls) {
      if (item.url.startsWith('data:image/')) {
        await uploadBase64ToStorageDirect(item.url, qAny.subject, item.name);
      } else {
        const { data: existing } = await supabase.from('assets').select('id').eq('public_url', item.url).maybeSingle();
        if (!existing) {
          const subjectFolder = (qAny.subject || 'general').toLowerCase().trim();
          await supabase.from('assets').insert({
            storage_path: `${subjectFolder}/q_${questionId}_${Date.now()}.png`,
            public_url: item.url,
            filename: item.name || `question_asset_${Date.now()}`,
            mime_type: 'image/png',
            size_bytes: item.url.length
          });
        }
      }
    }
  } catch (err) {
    console.warn('[SupabaseDirect] syncQuestionImagesToAssetsDirect error:', err);
  }
}
