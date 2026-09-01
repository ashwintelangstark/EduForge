-- Migration: Create science libraries (physics_symbols, chemistry_symbols, units, constants)
CREATE TABLE IF NOT EXISTS physics_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    symbol TEXT NOT NULL,
    latex TEXT NOT NULL,
    description TEXT,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chemistry_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    symbol TEXT NOT NULL,
    latex TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_type TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    latex TEXT NOT NULL,
    dimension TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS constants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    latex TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
