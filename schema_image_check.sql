-- Schema file for Actuhub Image Check Module
-- Copy and run in Supabase SQL Editor if needed

CREATE TABLE IF NOT EXISTS public.image_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_email TEXT,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    sha256 TEXT NOT NULL,
    phash TEXT NOT NULL,
    dhash TEXT,
    status TEXT NOT NULL DEFAULT 'processing',
    score INTEGER DEFAULT 0,
    ai_score INTEGER DEFAULT 0,
    manipulation_score INTEGER DEFAULT 0,
    authenticity_score INTEGER DEFAULT 0,
    classification TEXT NOT NULL DEFAULT 'INCONCLUSIF',
    confidence TEXT NOT NULL DEFAULT 'medium',
    explanation TEXT,
    fact_check_id TEXT,
    delete_after_analysis BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
