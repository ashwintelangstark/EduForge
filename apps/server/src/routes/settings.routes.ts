import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const settingsRouter = Router();

const defaultSettings = {
  defaultFont: 'Calibri, sans-serif',
  defaultFontSize: 10.5,
  defaultPaperSize: 'A4',
  defaultMargins: { top: 15, bottom: 15, left: 15, right: 15 },
  defaultQuestionStyle: 'number_dot',
  defaultOptionStyle: 'grid_2x2',
  defaultEquationSize: 12,
  autosaveIntervalMs: 2000,
  theme: 'white',
  exportSettings: {
    pdfDpi: 300,
    embedFonts: true,
    showPageNumbers: true
  },
  backupSettings: {
    autoBackupDaily: true,
    maxBackupsToKeep: 5
  }
};

// GET /api/settings
settingsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (error || !data || !data.settings) {
      return res.json({ success: true, data: defaultSettings });
    }
    res.json({ success: true, data: data.settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
settingsRouter.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ id: 1, settings: body, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data: data.settings });
  } catch (err) {
    next(err);
  }
});
