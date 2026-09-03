import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const authRouter = Router();

// POST /api/auth/check-user - Check if user email already exists to prevent duplicate signups
authRouter.post('/check-user', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { data: existingUser, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, assigned_subject')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Check user error:', error);
    }

    res.json({
      success: true,
      exists: Boolean(existingUser),
      user: existingUser || null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/signup - Register new user profile with role and assigned subject
authRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, role, assignedSubject } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in instead.'
      });
    }

    const validRole = role === 'admin' ? 'admin' : 'faculty';
    const validSubject = validRole === 'admin' ? 'All' : (assignedSubject || 'Biology');
    const validName = name?.trim() || cleanEmail.split('@')[0] || 'Faculty Member';

    let newUser: any = null;
    try {
      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: crypto.randomUUID(),
          email: cleanEmail,
          name: validName,
          role: validRole,
          assigned_subject: validSubject
        })
        .select()
        .single();
      if (!insertError && data) {
        newUser = data;
      }
    } catch (dbErr) {
      console.warn('Database insert warning on signup:', dbErr);
    }

    res.json({
      success: true,
      data: newUser || {
        id: crypto.randomUUID(),
        email: cleanEmail,
        name: validName,
        role: validRole,
        assigned_subject: validSubject
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login - Fetch and sync user profile upon login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    let userProfile: any = null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (data && !error) {
        userProfile = data;
      }
    } catch (dbErr) {
      console.warn('Database query warning on login:', dbErr);
    }

    if (!userProfile) {
      // Auto-provision if not found
      let autoRole: 'admin' | 'faculty' = 'faculty';
      let autoSub = 'Biology';
      let autoName = cleanEmail.split('@')[0];

      if (cleanEmail === 'admin@eduforge.com' || cleanEmail.startsWith('admin@')) {
        autoRole = 'admin';
        autoSub = 'All';
        autoName = 'System Admin';
      } else if (cleanEmail.includes('physics')) {
        autoSub = 'Physics';
        autoName = 'Physics Faculty';
      } else if (cleanEmail.includes('chemistry')) {
        autoSub = 'Chemistry';
        autoName = 'Chemistry Faculty';
      } else if (cleanEmail.includes('biology')) {
        autoSub = 'Biology';
        autoName = 'Biology Faculty';
      } else if (cleanEmail.includes('math')) {
        autoSub = 'Mathematics';
        autoName = 'Mathematics Faculty';
      }

      try {
        const { data: created } = await supabase
          .from('user_profiles')
          .insert({
            id: crypto.randomUUID(),
            email: cleanEmail,
            name: autoName,
            role: autoRole,
            assigned_subject: autoSub
          })
          .select()
          .single();
        if (created) {
          userProfile = created;
        }
      } catch (insertErr) {
        console.warn('Database insert warning on auto-provision:', insertErr);
      }
    }

    res.json({
      success: true,
      data: userProfile || {
        id: crypto.randomUUID(),
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: cleanEmail.startsWith('admin') ? 'admin' : 'faculty',
        assigned_subject: cleanEmail.startsWith('admin') ? 'All' : 'Biology'
      }
    });
  } catch (err) {
    next(err);
  }
});
