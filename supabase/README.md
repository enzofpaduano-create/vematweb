# Base de données Supabase — projet « Vemat web gestion »

## Ce dossier

- `historique/` : anciens scripts SQL (sites, portails PDR, SAV, anciens portails DG/Manager/Commercial), déplacés ici sans modification depuis `artifacts/vemat/` et la racine. **Ils ne doivent pas être rejoués tels quels** : l'état réel de la base est celui du projet Supabase en production, pas celui de ces fichiers.
- `migrations/` : à partir du 3 novembre 2026, toute évolution de sécurité ou de structure s'écrit dans un fichier daté (`AAAA-MM-JJ_nom.sql`) avec son fichier d'annulation dans `rollbacks/`, testé avant application.

## Ordre historique du portail PDR (pour mémoire)

1. `supabase-pdr-complete.sql`
2. `supabase-pdr-logistics.sql`
3. `supabase-pdr-delete-requests.sql`
4. `supabase-pdr-english-refs.sql`

Les fichiers `supabase-commercial-*`, `supabase-commandes-*`, `supabase-validation-workflow.sql`, etc. concernent des portails supprimés du site (DG, Manager, Commercial) ; leurs tables existent encore dans la base.

## Règles

- Aucun mot de passe, clé de service ou jeton dans ce dépôt.
- Les politiques d'accès (RLS) sont le seul rempart côté base : toute nouvelle table du schéma `public` doit avoir le RLS activé et des politiques explicites avant d'être utilisée par le site.
