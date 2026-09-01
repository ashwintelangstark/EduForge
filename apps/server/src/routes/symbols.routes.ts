import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const symbolsRouter = Router();

// GET /api/symbols
symbolsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('symbols').select('*');
    if (error || !data) {
      return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
