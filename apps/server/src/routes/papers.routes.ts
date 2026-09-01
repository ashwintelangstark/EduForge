import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const papersRouter = Router();

// GET /api/papers
papersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    let query = supabase.from('papers').select('*').order('created_at', { ascending: false });
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    const { data, error } = await query;
    if (error || !data) {
      return res.json({ success: true, data: [] });
    }
    const formatted = data.map((p: any) => ({
      id: p.id,
      title: p.title,
      templateId: p.template_id || 'a4-single-column',
      metadata: p.metadata || {},
      settings: p.settings || {},
      sections: p.sections || [],
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/papers/:id
papersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { data: p, error } = await supabase.from('papers').select('*').eq('id', id).single();
    if (error || !p) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAPER_NOT_FOUND', message: 'Paper not found' }
      });
    }
    const formatted = {
      id: p.id,
      title: p.title,
      templateId: p.template_id || 'a4-single-column',
      metadata: p.metadata || {},
      settings: p.settings || {},
      sections: p.sections || [],
      createdAt: p.created_at,
      updatedAt: p.updated_at
    };
    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

// POST /api/papers
papersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const template_id = isUuid(body.templateId) ? body.templateId : null;

    const { data: created, error } = await supabase
      .from('papers')
      .insert({
        title: body.title || 'Untitled Test',
        template_id,
        metadata: body.metadata || {},
        settings: body.settings || {},
        sections: body.sections || []
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Paper Insert Error:', error);
      throw error;
    }

    res.status(201).json({
      success: true,
      data: {
        id: created.id,
        title: created.title,
        templateId: created.template_id || body.templateId || 'a4-single-column',
        metadata: created.metadata,
        settings: created.settings,
        sections: created.sections,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      }
    });
  } catch (err) {
    console.error('Create paper error:', err);
    next(err);
  }
});

// PUT /api/papers/:id
papersRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const { data: updated, error } = await supabase
      .from('papers')
      .update({
        title: body.title,
        metadata: body.metadata,
        settings: body.settings,
        sections: body.sections,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        templateId: updated.template_id,
        metadata: updated.metadata,
        settings: updated.settings,
        sections: updated.sections,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/papers/:id
papersRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('papers').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
