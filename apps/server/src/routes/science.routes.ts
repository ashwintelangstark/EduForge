import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const scienceRouter = Router();

// GET /api/physics/chapters
scienceRouter.get('/physics/chapters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('physics_symbols').select('*');
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/chemistry/elements
scienceRouter.get('/chemistry/elements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('chemistry_symbols').select('*');
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/chemistry/notations
scienceRouter.get('/chemistry/notations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/units
scienceRouter.get('/units', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('units').select('*');
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/constants
scienceRouter.get('/constants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('constants').select('*');
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});
