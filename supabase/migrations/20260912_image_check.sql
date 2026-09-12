-- =========================================================================
-- ACTUHUB IMAGE CHECK DATABASE SCHEMA & MIGRATION (SUPABASE / POSTGRESQL)
-- =========================================================================

-- 1. Main table for Image Scans
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
    status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    score INTEGER DEFAULT 0,
    ai_score INTEGER DEFAULT 0,
    manipulation_score INTEGER DEFAULT 0,
    authenticity_score INTEGER DEFAULT 0,
    classification TEXT NOT NULL DEFAULT 'INCONCLUSIF',
    confidence TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    explanation TEXT,
    fact_check_id TEXT,
    delete_after_analysis BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Index for fast hashing search (deduplication & visual matches)
CREATE INDEX IF NOT EXISTS idx_image_scans_sha256 ON public.image_scans(sha256);
CREATE INDEX IF NOT EXISTS idx_image_scans_phash ON public.image_scans(phash);
CREATE INDEX IF NOT EXISTS idx_image_scans_user_id ON public.image_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_image_scans_fact_check_id ON public.image_scans(fact_check_id);

-- 2. Metadata details
CREATE TABLE IF NOT EXISTS public.image_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES public.image_scans(id) ON DELETE CASCADE,
    camera TEXT,
    device TEXT,
    software TEXT,
    date_taken TEXT,
    gps JSONB,
    orientation TEXT,
    dimensions JSONB,
    color_space TEXT,
    raw_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_metadata_scan_id ON public.image_metadata(scan_id);

-- 3. AI Analysis details
CREATE TABLE IF NOT EXISTS public.image_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES public.image_scans(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    ai_probability REAL NOT NULL DEFAULT 0,
    human_probability REAL NOT NULL DEFAULT 100,
    confidence TEXT NOT NULL DEFAULT 'medium',
    signals JSONB DEFAULT '[]'::jsonb,
    limitations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_ai_analysis_scan_id ON public.image_ai_analysis(scan_id);

-- 4. Forensics details
CREATE TABLE IF NOT EXISTS public.image_forensics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES public.image_scans(id) ON DELETE CASCADE,
    ela_score REAL DEFAULT 0,
    compression_score REAL DEFAULT 0,
    noise_score REAL DEFAULT 0,
    manipulation_score REAL DEFAULT 0,
    anomalies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_forensics_scan_id ON public.image_forensics(scan_id);

-- 5. Provenance (C2PA / Content Credentials)
CREATE TABLE IF NOT EXISTS public.image_provenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES public.image_scans(id) ON DELETE CASCADE,
    c2pa_found BOOLEAN DEFAULT FALSE,
    signature_valid BOOLEAN,
    creator TEXT,
    software TEXT,
    manifest JSONB,
    provenance JSONB DEFAULT '[]'::jsonb,
    synthid_status TEXT DEFAULT 'SynthID : non vérifiable localement.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_provenance_scan_id ON public.image_provenance(scan_id);

-- 6. Generated Reports Summary
CREATE TABLE IF NOT EXISTS public.image_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES public.image_scans(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    classification TEXT NOT NULL,
    score INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_reports_scan_id ON public.image_reports(scan_id);

-- Row Level Security (RLS) setup
ALTER TABLE public.image_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_forensics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access for reports or owner access
CREATE POLICY "Public read for image scans" ON public.image_scans FOR SELECT USING (true);
CREATE POLICY "Public insert for image scans" ON public.image_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update for image scans" ON public.image_scans FOR UPDATE USING (true);
CREATE POLICY "Public delete for image scans" ON public.image_scans FOR DELETE USING (true);

CREATE POLICY "Public read for image_metadata" ON public.image_metadata FOR SELECT USING (true);
CREATE POLICY "Public insert for image_metadata" ON public.image_metadata FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read for image_ai_analysis" ON public.image_ai_analysis FOR SELECT USING (true);
CREATE POLICY "Public insert for image_ai_analysis" ON public.image_ai_analysis FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read for image_forensics" ON public.image_forensics FOR SELECT USING (true);
CREATE POLICY "Public insert for image_forensics" ON public.image_forensics FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read for image_provenance" ON public.image_provenance FOR SELECT USING (true);
CREATE POLICY "Public insert for image_provenance" ON public.image_provenance FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read for image_reports" ON public.image_reports FOR SELECT USING (true);
CREATE POLICY "Public insert for image_reports" ON public.image_reports FOR INSERT WITH CHECK (true);
