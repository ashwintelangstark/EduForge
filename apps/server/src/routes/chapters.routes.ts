import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const chaptersRouter = Router();

// Helper to resolve or auto-create valid subject_id UUID
async function resolveSubjectId(subjectIdOrName?: any): Promise<string | null> {
  if (!subjectIdOrName) {
    const { data: firstSub } = await supabase.from('subjects').select('id').limit(1).maybeSingle();
    return firstSub?.id || null;
  }

  const strVal = String(subjectIdOrName).trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(strVal)) {
    return strVal;
  }

  // Search by name or code in subjects table
  const { data: existingSub } = await supabase
    .from('subjects')
    .select('id')
    .or(`name.ilike.${strVal},code.ilike.${strVal}`)
    .limit(1)
    .maybeSingle();

  if (existingSub?.id) {
    return existingSub.id;
  }

  // Create subject if not exists
  const subCode = strVal.substring(0, 3).toUpperCase();
  const { data: newSub } = await supabase
    .from('subjects')
    .insert({ name: strVal, code: subCode, color: 'bg-teal-50 text-teal-700 border-teal-200' })
    .select('id')
    .single();

  return newSub?.id || null;
}

// GET /api/chapters
chaptersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.query;
    let query = supabase.from('chapters').select('*, subjects(name)').order('created_at', { ascending: false });

    if (subjectId) {
      const targetUuid = await resolveSubjectId(subjectId as string);
      if (targetUuid) {
        query = query.eq('subject_id', targetUuid);
      }
    }

    const [chaptersRes, questionsRes] = await Promise.all([
      query,
      supabase.from('questions').select('id, chapter_id, subject_id')
    ]);

    if (chaptersRes.error) {
      console.error('Supabase getChapters error:', chaptersRes.error);
      return res.json({ success: true, data: [] });
    }

    let chapters = chaptersRes.data || [];
    const userSubject = (req.query.userSubject || req.query.subject || req.headers['x-user-subject'] || 'All') as string;
    if (userSubject && userSubject !== 'All') {
      chapters = chapters.filter((c: any) => (c.subjects?.name || '').toLowerCase() === userSubject.toLowerCase());
    }
    const questions = questionsRes.data || [];

    const formatted = chapters.map((ch: any) => {
      const chId = String(ch.id || '').toLowerCase();

      const qCount = questions.filter((q: any) => {
        const qChId = q.chapter_id ? String(q.chapter_id).toLowerCase() : '';
        return qChId === chId;
      }).length;

      return {
        id: ch.id,
        title: ch.title,
        code: ch.chapter_code,
        subject: ch.subjects?.name || 'Biology',
        subjectId: ch.subject_id,
        count: qCount
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/chapters
chaptersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId, subject, title, name, code } = req.body;
    const targetUuid = await resolveSubjectId(subjectId || subject);

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        subject_id: targetUuid,
        title: title || name,
        chapter_code: code || `CH-${Date.now().toString().slice(-4)}`
      })
      .select('*, subjects(name)')
      .single();

    if (error) {
      console.error('Supabase create chapter error:', error);
      throw error;
    }

    const formatted = {
      id: data.id,
      title: data.title,
      code: data.chapter_code,
      subject: data.subjects?.name || subject || 'Biology',
      subjectId: data.subject_id,
      count: 0
    };

    res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    console.error('Create chapter route error:', err);
    next(err);
  }
});

// PUT /api/chapters/:id
chaptersRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, name, code, subject, subjectId } = req.body;

    const updatePayload: any = {
      title: title || name,
      updated_at: new Date().toISOString()
    };
    if (code) updatePayload.chapter_code = code;
    if (subjectId || subject) {
      const targetUuid = await resolveSubjectId(subjectId || subject);
      if (targetUuid) updatePayload.subject_id = targetUuid;
    }

    const { data, error } = await supabase
      .from('chapters')
      .update(updatePayload)
      .eq('id', id)
      .select('*, subjects(name)')
      .single();

    if (error) throw error;

    const formatted = {
      id: data.id,
      title: data.title,
      code: data.chapter_code,
      subject: data.subjects?.name || subject || 'Biology',
      subjectId: data.subject_id,
      count: 0
    };

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/chapters/:id
chaptersRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
