export interface UserProfile {
  email: string;
  name: string;
  role: 'admin' | 'faculty' | 'guest';
  assigned_subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics' | 'All' | 'None';
}

export function getUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem('eduforge_user');
    if (saved) {
      const u = JSON.parse(saved);
      const email = (u.email || '').toLowerCase().trim();

      if (email === 'admin@eduforge.com' || email.startsWith('admin')) {
        return {
          email: u.email || 'admin@eduforge.com',
          name: u.name || 'System Admin',
          role: 'admin',
          assigned_subject: 'All'
        };
      }

      if (email.includes('physics') || email.includes('phy')) {
        return {
          email: u.email || 'physics@eduforge.com',
          name: u.name || 'Physics Faculty',
          role: 'faculty',
          assigned_subject: 'Physics'
        };
      }

      if (email.includes('chemistry') || email.includes('chem')) {
        return {
          email: u.email || 'chemistry@eduforge.com',
          name: u.name || 'Chemistry Faculty',
          role: 'faculty',
          assigned_subject: 'Chemistry'
        };
      }

      if (email.includes('biology') || email.includes('bio')) {
        return {
          email: u.email || 'biology@eduforge.com',
          name: u.name || 'Biology Faculty',
          role: 'faculty',
          assigned_subject: 'Biology'
        };
      }

      if (email.includes('maths') || email.includes('math')) {
        return {
          email: u.email || 'maths@eduforge.com',
          name: u.name || 'Mathematics Faculty',
          role: 'faculty',
          assigned_subject: 'Mathematics'
        };
      }

      // If user profile has explicitly saved role & assigned_subject, normalize it
      if (u.assigned_subject && u.assigned_subject !== 'None') {
        let cleanSub: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics' | 'All' = 'Physics';
        const subLower = String(u.assigned_subject).toLowerCase();
        if (subLower.includes('phys')) cleanSub = 'Physics';
        else if (subLower.includes('chem')) cleanSub = 'Chemistry';
        else if (subLower.includes('bio')) cleanSub = 'Biology';
        else if (subLower.includes('math')) cleanSub = 'Mathematics';
        else if (subLower.includes('all')) cleanSub = 'All';

        return {
          email: u.email || email,
          name: u.name || (email.split('@')[0] || 'Faculty Member'),
          role: u.role || 'faculty',
          assigned_subject: cleanSub
        };
      }

      return {
        email: u.email || email,
        name: u.name || (email.split('@')[0] || 'Faculty Member'),
        role: u.role || 'faculty',
        assigned_subject: 'Physics'
      };
    }
  } catch {}

  return {
    email: 'admin@eduforge.com',
    name: 'Administrator',
    role: 'admin',
    assigned_subject: 'All'
  };
}
