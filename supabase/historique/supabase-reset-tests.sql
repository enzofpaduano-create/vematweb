-- ─────────────────────────────────────────────────────────────────────────────
-- NETTOYAGE PORTAILS VEMAT — Pour tests
-- Exécuter dans Supabase → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

-- Vider toutes les demandes de devis publiques
TRUNCATE TABLE form_devis RESTART IDENTITY;

-- Vider toutes les demandes d'intervention publiques
TRUNCATE TABLE form_interventions RESTART IDENTITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONNEL — Si tu veux aussi vider les données internes des portails :
-- (décommenter selon besoin)
-- ─────────────────────────────────────────────────────────────────────────────

-- Vider les commandes (devis_requests)
-- TRUNCATE TABLE devis_requests RESTART IDENTITY CASCADE;

-- Vider les réparations (repair_requests)
-- TRUNCATE TABLE repair_requests RESTART IDENTITY CASCADE;

-- Vider l'historique des statuts
-- TRUNCATE TABLE status_history RESTART IDENTITY;

-- Vider les notifications
-- TRUNCATE TABLE notifications RESTART IDENTITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONNEL — Vider les fichiers du bucket Storage intervention-files
-- (à faire dans Storage → intervention-files → sélectionner tout → supprimer)
-- ─────────────────────────────────────────────────────────────────────────────
