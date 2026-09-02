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

      const { data, error } = await query;
      if (error || !data) {
        console.warn('[SupabaseDirect] getQuestions error:', error);
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
    const rawText = question.rawText || (Array.isArray(question.content) ? question.content.map((b: any) => b.text || b.html || '').join(' ') : '');
    let questionCode = (question as any).questionCode || (question as any).question_code;
    if (!questionCode || questionCode.startsWith('Q-') || questionCode === 'undefined') {
      const sub = (question.subject || 'BIO').trim().toUpperCase().substring(0, 3);
      const chClean = (question.chapter || 'GEN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
      const num = String(Math.floor(Math.random() * 9000) + 1000);
      questionCode = `${sub}-${chClean.padEnd(3, 'X')}-${num}`;
    }

    let subject_id = (question as any).subjectId || (question as any).subject_id || null;
    let chapter_id = (question as any).chapterId || (question as any).chapter_id || null;

    // Resolve subject_id if missing
    if (!subject_id && question.subject) {
      const { data: subs } = await supabase.from('subjects').select('id, name').ilike('name', question.subject).maybeSingle();
      if (subs?.id) subject_id = subs.id;
    }
    // Resolve chapter_id if missing
    if (!chapter_id && question.chapter) {
      let chQuery = supabase.from('chapters').select('id, title').ilike('title', question.chapter);
      if (subject_id) chQuery = chQuery.eq('subject_id', subject_id);
      const { data: chs } = await chQuery.maybeSingle();
      if (chs?.id) chapter_id = chs.id;
    }

    let contentToSave: any[] = Array.isArray(question.content) ? [...question.content] : [];
    if (question.diagramSvg && !contentToSave.some((b: any) => b.type === 'diagram' || b.diagramSvg || b.svg)) {
      contentToSave.push({ type: 'diagram', diagramSvg: question.diagramSvg, svg: question.diagramSvg });
    }
    if (question.imageUrl && !contentToSave.some((b: any) => b.type === 'image' || b.url || b.imageUrl)) {
      contentToSave.push({ type: 'image', url: question.imageUrl, imageUrl: question.imageUrl } as any);
    }

    const insertPayload: any = {
      question_code: questionCode,
      subject_id,
      chapter_id,
      question_type: question.questionType || 'MCQ_SINGLE',
      content: contentToSave,
      explanation: question.explanation || (question as any).explanationText || [],
      difficulty: question.difficulty || 'Medium',
      marks: Number(question.marks) || 4,
      negative_marks: Number(question.negativeMarks) !== undefined ? Number(question.negativeMarks) : 1,
      correct_option: (question.correctAnswer || (question as any).correctOption || 'A').toLowerCase(),
      option_layout: question.optionLayout || 'grid_2x2',
      raw_text: rawText,
      year: question.year || null,
      source: question.source || 'saved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (question.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(question.id)) {
      insertPayload.id = question.id;
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
    if (Array.isArray(question.options) && question.options.length > 0) {
      const formattedOpts = question.options.map((opt: any, idx: number) => {
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

    return { ...question, id: newQ.id, questionCode } as Question;
  },

  async updateQuestion(id: string, question: Partial<Question>): Promise<Question> {
    const rawText = question.rawText || (Array.isArray(question.content) ? question.content.map((b: any) => b.text || b.html || '').join(' ') : '');
    const qAny = question as any;
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };
    if (question.questionCode) updatePayload.question_code = question.questionCode;
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
  }
};
