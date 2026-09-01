import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const subjectsRouter = Router();

// GET /api/subjects
subjectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [subsRes, chsRes, qsRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('chapters').select('id, subject_id, title'),
      supabase.from('questions').select('id, subject_id, chapter_id')
    ]);

    if (subsRes.error) {
      console.error('Supabase getSubjects error:', subsRes.error);
      return res.json({ success: true, data: [] });
    }

    let subjects = subsRes.data || [];
    const userSubject = (req.query.userSubject || req.query.subject || req.headers['x-user-subject'] || 'All') as string;
    if (userSubject && userSubject !== 'All') {
      subjects = subjects.filter((s: any) => s.name.toLowerCase() === userSubject.toLowerCase());
    }
    const chapters = chsRes.data || [];
    const questions = qsRes.data || [];

    const formatted = subjects.map((s: any) => {
      const sId = String(s.id || '').toLowerCase();

      // Count chapters belonging to this subject
      const chCount = chapters.filter((c: any) => {
        const cSubId = c.subject_id ? String(c.subject_id).toLowerCase() : '';
        return cSubId === sId;
      }).length;

      // Count questions belonging to this subject
      const qCount = questions.filter((q: any) => {
        const qSubId = q.subject_id ? String(q.subject_id).toLowerCase() : '';
        return qSubId === sId;
      }).length;

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        color: s.color || 'bg-slate-50 text-slate-700 border-slate-200',
        chapters: chCount,
        questions: qCount
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects
subjectsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, color } = req.body;
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code, color })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subjects/:id
subjectsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, code, color } = req.body;
    const { data, error } = await supabase
      .from('subjects')
      .update({ name, code, color, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subjects/:id
subjectsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
