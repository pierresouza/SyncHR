-- SQL Schema for SyncHR (Smart Leading)
-- Execute this in the Supabase SQL Editor (https://supabase.com/dashboard/project/gmkrqshscvxxmocqdokk/sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('LEADER', 'RH', 'COLLABORATOR')),
    profile_type TEXT NOT NULL CHECK (profile_type IN ('TECNICO', 'TRANSICAO', 'ENGAJADO', 'PENDENTE', 'ADMINISTRADOR')),
    level_from TEXT,
    level_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: collaborators
CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    disc TEXT NOT NULL CHECK (disc IN ('DOMINANTE', 'ESTAVEL', 'ANALITICO', 'INFLUENTE')),
    level TEXT NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'L4')),
    role TEXT NOT NULL,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: one_on_ones
CREATE TABLE IF NOT EXISTS public.one_on_ones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    context TEXT,
    script_text TEXT,
    raw_leader_notes TEXT,
    raw_collaborator_notes TEXT,
    transcription TEXT,
    final_summary TEXT,
    leader_approved BOOLEAN DEFAULT FALSE,
    collaborator_approved BOOLEAN DEFAULT FALSE,
    consistency_result JSONB,
    ata_template_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: conflicts
CREATE TABLE IF NOT EXISTS public.conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol TEXT UNIQUE NOT NULL,
    collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_INVESTIGATION', 'RESOLVED', 'UNRESOLVED')),
    notes TEXT,
    has_history BOOLEAN DEFAULT FALSE,
    is_bypass BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default collaborators (Optional mock seeding matching current project mock)
-- Note: UUIDs will be generated. We can insert them locally or mock them.

-- Enable Row Level Security (RLS) on all tables (Securing public schema)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_on_ones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent duplicate execution errors
DROP POLICY IF EXISTS "Allow authenticated select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated all on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated select on collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Allow authenticated all on collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Allow authenticated all on one_on_ones" ON public.one_on_ones;
DROP POLICY IF EXISTS "Allow authenticated all on conflicts" ON public.conflicts;

-- Policies for public.profiles (allow select to all authenticated users, allow insert/update to authenticated users)
CREATE POLICY "Allow authenticated select on profiles" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all on profiles" 
ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for public.collaborators (allow select and mutate to authenticated users)
CREATE POLICY "Allow authenticated select on collaborators" 
ON public.collaborators FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all on collaborators" 
ON public.collaborators FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for public.one_on_ones (allow select and mutate to authenticated users)
CREATE POLICY "Allow authenticated all on one_on_ones" 
ON public.one_on_ones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for public.conflicts (allow select and mutate to authenticated users)
CREATE POLICY "Allow authenticated all on conflicts" 
ON public.conflicts FOR ALL TO authenticated USING (true) WITH CHECK (true);

