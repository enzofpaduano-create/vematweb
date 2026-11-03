-- ============================================================
-- FORMULAIRES PUBLICS — à exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- 1. Table : demandes de devis (formulaire public /demande-devis)
CREATE TABLE IF NOT EXISTS form_devis (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             TEXT        NOT NULL,
  company_name          TEXT        NOT NULL,
  contact_name          TEXT        NOT NULL,
  contact_phone         TEXT        NOT NULL,
  contact_email         TEXT        NOT NULL,
  product_category      TEXT,
  product_brand         TEXT,
  product_model         TEXT,
  quantity              INTEGER     NOT NULL DEFAULT 1,
  location              TEXT,
  desired_date          DATE,
  notes                 TEXT,
  status                TEXT        NOT NULL DEFAULT 'nouveau'
                                    CHECK (status IN ('nouveau', 'traite', 'converti')),
  converted_to_order_id UUID        REFERENCES devis_requests(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table : demandes d'intervention (formulaire public /demande-intervention)
CREATE TABLE IF NOT EXISTS form_interventions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             TEXT        NOT NULL,
  company_name          TEXT        NOT NULL,
  contact_name          TEXT        NOT NULL,
  contact_phone         TEXT        NOT NULL,
  contact_email         TEXT        NOT NULL,
  machine_type          TEXT        NOT NULL,
  machine_brand         TEXT,
  machine_model         TEXT,
  machine_serial        TEXT,
  problem_description   TEXT        NOT NULL,
  urgency               TEXT        NOT NULL DEFAULT 'normale'
                                    CHECK (urgency IN ('normale', 'urgente', 'tres_urgente')),
  location              TEXT        NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'nouveau'
                                    CHECK (status IN ('nouveau', 'traite', 'cree')),
  converted_to_repair_id UUID       REFERENCES repair_requests(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Désactiver RLS (les formulaires sont publics — pas d'authentification)
ALTER TABLE form_devis        DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_interventions DISABLE ROW LEVEL SECURITY;

-- 4. (Optionnel) Index pour accélérer les recherches par statut
CREATE INDEX IF NOT EXISTS idx_form_devis_status        ON form_devis(status);
CREATE INDEX IF NOT EXISTS idx_form_interventions_status ON form_interventions(status);
CREATE INDEX IF NOT EXISTS idx_form_devis_created        ON form_devis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_interventions_created ON form_interventions(created_at DESC);
