import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const attemptsRouter = Router();

// GET /api/attempts - Fetch all test attempt logs
attemptsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('test_attempts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return res.json({ success: true, data: [] });
    }

    const formatted = data.map((a: any) => ({
      id: a.id,
      student: a.student,
      test: a.test,
      score: a.score,
      accuracy: a.accuracy,
      status: a.status,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/attempts/:id
attemptsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { data: a, error } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !a) {
      return res.status(404).json({
        success: false,
        error: { code: 'ATTEMPT_NOT_FOUND', message: 'Test attempt record not found' }
      });
    }

    res.json({
      success: true,
      data: {
        id: a.id,
        student: a.student,
        test: a.test,
        score: a.score,
        accuracy: a.accuracy,
        status: a.status,
        createdAt: a.created_at,
        updatedAt: a.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/attempts - Create test attempt log
attemptsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;

    const { data: created, error } = await supabase
      .from('test_attempts')
      .insert({
        student: body.student || 'Anonymous Student',
        test: body.test || 'General Assessment',
        score: body.score || '0 / 100',
        accuracy: body.accuracy || '0%',
        status: body.status || 'Completed'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Test Attempt Insert Error:', error);
      throw error;
    }

    res.status(201).json({
      success: true,
      data: {
        id: created.id,
        student: created.student,
        test: created.test,
        score: created.score,
        accuracy: created.accuracy,
        status: created.status,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      }
    });
  } catch (err) {
    console.error('Create attempt error:', err);
    next(err);
  }
});

// PUT /api/attempts/:id - Update test attempt log
attemptsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const { data: updated, error } = await supabase
      .from('test_attempts')
      .update({
        student: body.student,
        test: body.test,
        score: body.score,
        accuracy: body.accuracy,
        status: body.status,
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
        student: updated.student,
        test: updated.test,
        score: updated.score,
        accuracy: updated.accuracy,
        status: updated.status,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/attempts/:id - Delete test attempt log
attemptsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('test_attempts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
