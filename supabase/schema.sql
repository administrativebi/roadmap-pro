-- =====================================================
-- SCHEMA ATUALIZADO — Checklist Pro (v2)
-- Suporte a: perguntas tipadas, fotos, agenda, gamificação
-- =====================================================

-- Tabela de Organizações (Restaurantes, com Skins)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  theme JSONB DEFAULT '{
    "colors": {"primary": "#000000", "accent": "#FFD700", "background": "#F9F9F9"},
    "assets": {"logo": null, "dashboard_bg": null}
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Setores da Empresa
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  notion_page_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Usuários (com gamificação expandida)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  notion_page_id TEXT,
  global_score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pivot: Organizações x Usuários
CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Templates de Checklists (com perguntas tipadas)
CREATE TABLE checklists_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  category TEXT,
  estimated_minutes INTEGER DEFAULT 15,
  -- questions é um array de objetos com: id, text, type, is_required, options[], 
  -- allow_photo, photo_required, placeholder, min_value, max_value, points
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entradas/Execuções de Checklists
CREATE TABLE checklists_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES checklists_templates(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  schedule_id UUID, -- referência para agenda (FK adicionada abaixo)
  status TEXT CHECK (status IN ('in_progress', 'completed', 'canceled')) DEFAULT 'in_progress',
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  completed_at TIMESTAMPTZ,
  -- responses é um array de objetos: {question_id, value, photo_urls[], answered_at}
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agenda de Checklists (Calendário)
CREATE TABLE checklist_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES checklists_templates(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')) DEFAULT 'none',
  status TEXT CHECK (status IN ('pending', 'completed', 'overdue', 'skipped')) DEFAULT 'pending',
  entry_id UUID REFERENCES checklists_entries(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar FK de schedule na entries
ALTER TABLE checklists_entries 
  ADD CONSTRAINT fk_schedule 
  FOREIGN KEY (schedule_id) REFERENCES checklist_schedules(id) ON DELETE SET NULL;

-- Planos de Ação
CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_entry_id UUID REFERENCES checklists_entries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  benefit TEXT,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  step_by_step TEXT,
  cost_type TEXT CHECK (cost_type IN ('apenas_tempo', 'dinheiro')),
  estimated_cost NUMERIC(10,2),
  awarded_xp INTEGER,
  ai_suggestion TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'resolved', 'canceled')) DEFAULT 'pending',
  notion_page_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Logs de Gamificação (com badges)
CREATE TABLE gamification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  checklist_entry_id UUID REFERENCES checklists_entries(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  badge_earned TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRIGGERS ──────────────────────────────────────────────

-- TRIGGER 1: Atualizar score global e checar level up
CREATE OR REPLACE FUNCTION update_user_score_and_level()
RETURNS TRIGGER AS $$
DECLARE
  new_score INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE users 
  SET global_score = global_score + NEW.points,
      last_activity_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Buscar score atualizado
  SELECT global_score INTO new_score FROM users WHERE id = NEW.user_id;
  
  -- Calcular nível
  new_level := CASE
    WHEN new_score >= 12000 THEN 7
    WHEN new_score >= 8000 THEN 6
    WHEN new_score >= 5000 THEN 5
    WHEN new_score >= 3000 THEN 4
    WHEN new_score >= 1500 THEN 3
    WHEN new_score >= 500 THEN 2
    ELSE 1
  END;
  
  UPDATE users SET level = new_level WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_gamification_log_insert
AFTER INSERT ON gamification_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_score_and_level();

-- TRIGGER 2: Marcar schedules como overdue
CREATE OR REPLACE FUNCTION mark_overdue_schedules()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE checklist_schedules
  SET status = 'overdue'
  WHERE status = 'pending'
    AND scheduled_date < CURRENT_DATE;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Storage bucket para fotos (executar no Supabase Dashboard):
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('checklist-photos', 'checklist-photos', true);
