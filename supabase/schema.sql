-- 1. PERIODS
CREATE TABLE IF NOT EXISTS periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g. "2026"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. UNITS
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE -- Sul, Norte, Taguatinga
);

-- 3. GRADES
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 6º ano, 7º ano... 3ª série
    level INTEGER NOT NULL -- For sorting
);

-- 4. CLASSES (TURMAS)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- A, B, C...
    access_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    componente TEXT,
    enunciado TEXT NOT NULL,
    image_url TEXT,
    options JSONB NOT NULL, -- { "A": "...", "B": "...", ... }
    correct_option CHAR(1) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TEAMS (A team within a class)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Team name (e.g. "Equipe 1" or Class Name)
    access_key TEXT UNIQUE, -- If we want unique keys per team, but user asked for code per class
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ANSWERS
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_option CHAR(1),
    is_correct BOOLEAN,
    points INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, question_id)
);

-- 8. INITIAL DATA (SEEDS)
INSERT INTO units (name) VALUES ('Sul'), ('Norte'), ('Taguatinga') ON CONFLICT DO NOTHING;

INSERT INTO grades (name, level) VALUES 
('6º ano', 6), 
('7º ano', 7), 
('8º ano', 8), 
('9º ano', 9), 
('1ª série', 10), 
('2ª série', 11), 
('3ª série', 12) 
ON CONFLICT DO NOTHING;

-- RLS POLICIES (Simplified for public access via access code)
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Allow public read of classes by access_code
CREATE POLICY "Public read classes by access_code" ON classes FOR SELECT USING (true);
CREATE POLICY "Public read periods" ON periods FOR SELECT USING (true);
CREATE POLICY "Public read units" ON units FOR SELECT USING (true);
CREATE POLICY "Public read grades" ON grades FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public manage answers" ON answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage teams" ON teams FOR ALL USING (true) WITH CHECK (true);

-- Admin policies (assuming admin uses service role or has a specific role in auth.users)
-- For this simplified demo, we use public access but in production you'd use Auth.
