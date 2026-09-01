import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const templatesRouter = Router();

// GET /api/templates
templatesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('templates').select('*');
    if (error || !data || data.length === 0) {
      return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/templates/:id
templatesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();
    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' }
      });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
