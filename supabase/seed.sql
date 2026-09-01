-- Seed Data for EduForge Supabase PostgreSQL

-- Insert Subjects
INSERT INTO subjects (id, name, code, color) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Physics', 'PHY', 'bg-sky-50 text-sky-700 border-sky-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Chemistry', 'CHE', 'bg-indigo-50 text-indigo-700 border-indigo-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Biology', 'BIO', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Mathematics', 'MAT', 'bg-amber-50 text-amber-700 border-amber-200')
ON CONFLICT (code) DO NOTHING;

-- Insert Chapters
INSERT INTO chapters (id, subject_id, chapter_code, title) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHY-MOT-0041', 'Kinematics & Motion'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHY-ELE-0089', 'Electrostatics & Current'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'CHE-ATOM-0027', 'Atomic Structure & Bonding'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'CHE-ORG-0105', 'Organic Reaction Mechanisms'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'BIO-CELL-0012', 'Cell Structure & Function'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'BIO-GEN-0054', 'Genetics & Inheritance')
ON CONFLICT DO NOTHING;

-- Insert Sample Questions
INSERT INTO questions (id, question_code, subject_id, chapter_id, question_type, content, explanation, difficulty, marks, negative_marks, correct_option, option_layout, year, source, raw_text) VALUES
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    'Q-PHY-001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    'MCQ',
    '[{"type":"text","html":"<p>A particle starts from rest with a uniform acceleration of 2 m/s². What is its velocity after 5 seconds?</p>"},{"type":"equation","latex":"v = u + at"}]'::jsonb,
    '[{"type":"text","html":"<p>Using v = u + at, where u = 0, a = 2 m/s², t = 5s: v = 0 + 2*5 = 10 m/s.</p>"}]'::jsonb,
    'Easy',
    1.0,
    0.25,
    'b',
    'grid_2x2',
    2024,
    'NEET Prep',
    'A particle starts from rest with a uniform acceleration of 2 m/s². What is its velocity after 5 seconds?'
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12',
    'Q-PHY-002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
    'MCQ',
    '[{"type":"text","html":"<p>What is the electric field intensity at a distance r from a point charge Q in vacuum?</p>"},{"type":"equation","latex":"E = \\frac{1}{4\\pi \\varepsilon_0} \\frac{Q}{r^2}"}]'::jsonb,
    '[{"type":"text","html":"<p>By Coulomb Law, electrostatic field intensity E is inverse-square proportional to r.</p>"}]'::jsonb,
    'Medium',
    2.0,
    0.5,
    'a',
    'grid_2x2',
    2023,
    'JEE Main',
    'What is the electric field intensity at a distance r from a point charge Q in vacuum?'
  )
ON CONFLICT (question_code) DO NOTHING;

-- Insert Question Options
INSERT INTO question_options (id, question_id, option_key, content, sort_order) VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a', '[{"type":"text","html":"<p>5 m/s</p>"}]'::jsonb, 1),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b', '[{"type":"text","html":"<p>10 m/s</p>"}]'::jsonb, 2),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'c', '[{"type":"text","html":"<p>15 m/s</p>"}]'::jsonb, 3),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'd', '[{"type":"text","html":"<p>20 m/s</p>"}]'::jsonb, 4),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'a', '[{"type":"equation","latex":"\\frac{1}{4\\pi \\varepsilon_0}\\frac{Q}{r^2}"}]'::jsonb, 1),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'b', '[{"type":"equation","latex":"\\frac{1}{4\\pi \\varepsilon_0}\\frac{Q}{r}"}]'::jsonb, 2),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'c', '[{"type":"equation","latex":"\\frac{1}{4\\pi \\varepsilon_0}\\frac{Q^2}{r^2}"}]'::jsonb, 3),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'd', '[{"type":"equation","latex":"\\frac{Q}{r^3}"}]'::jsonb, 4)
ON CONFLICT DO NOTHING;
