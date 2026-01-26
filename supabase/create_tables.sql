-- ============================================================
-- MICHAEL D1 PATHWAY - TABLE CREATION ONLY
-- Run this FIRST in Supabase SQL Editor
-- https://supabase.com/dashboard/project/mocerqjnksmhcjzxrewo/sql/new
-- ============================================================

-- 1. REPOSITORY FILES TABLE
CREATE TABLE IF NOT EXISTS michael_d1_repo_files (
    id SERIAL PRIMARY KEY,
    repo_name TEXT NOT NULL DEFAULT 'michael-d1-pathway',
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    sha TEXT,
    content_base64 TEXT NOT NULL,
    content_text TEXT,
    version TEXT DEFAULT '1.0',
    source TEXT DEFAULT 'github',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repo_name, file_path)
);

-- 2. MELACHA PROHIBITED DATES
CREATE TABLE IF NOT EXISTS melacha_prohibited_dates (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    hebrew TEXT,
    category TEXT,
    yom_sheni_galuyot BOOLEAN DEFAULT FALSE,
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. יום שני של גלויות
CREATE TABLE IF NOT EXISTS yom_sheni_galuyot (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    hebrew TEXT,
    english_name TEXT,
    first_day_name TEXT,
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. D1 TARGET SCHOOLS
CREATE TABLE IF NOT EXISTS d1_target_schools (
    id SERIAL PRIMARY KEY,
    rank INTEGER,
    tier TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT,
    city TEXT,
    state TEXT,
    conference TEXT,
    swimming_rank TEXT,
    head_coach TEXT,
    coach_email TEXT,
    coach_phone TEXT,
    coach_website TEXT,
    coach_bio TEXT,
    engineering_college TEXT,
    engineering_ranking TEXT,
    engineering_majors TEXT[],
    real_estate_minor BOOLEAN DEFAULT FALSE,
    chabad_rabbi TEXT,
    chabad_phone TEXT,
    chabad_email TEXT,
    chabad_address TEXT,
    chabad_website TEXT,
    jewish_students TEXT,
    kosher_dining BOOLEAN DEFAULT FALSE,
    israeli_connection TEXT,
    weather TEXT,
    michael_fit TEXT,
    family_goal BOOLEAN DEFAULT FALSE,
    safety_school BOOLEAN DEFAULT FALSE,
    notes JSONB,
    contact_date DATE,
    response_received BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MEET SCHEDULE
CREATE TABLE IF NOT EXISTS michael_meet_schedule (
    id SERIAL PRIMARY KEY,
    meet_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location TEXT,
    course TEXT,
    priority TEXT,
    shabbat_conflict BOOLEAN DEFAULT FALSE,
    yom_tov_conflict BOOLEAN DEFAULT FALSE,
    conflict_details TEXT,
    events_entered TEXT[],
    status TEXT DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meet_name, start_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_repo_files_path ON michael_d1_repo_files(file_path);
CREATE INDEX IF NOT EXISTS idx_melacha_date ON melacha_prohibited_dates(date);
CREATE INDEX IF NOT EXISTS idx_yom_sheni_date ON yom_sheni_galuyot(date);
CREATE INDEX IF NOT EXISTS idx_schools_tier ON d1_target_schools(tier);
CREATE INDEX IF NOT EXISTS idx_meet_schedule_date ON michael_meet_schedule(start_date);

-- Done! Now run the Python script to insert data via REST API.
