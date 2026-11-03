# Vemat Group — site web et portails

Site public : https://www.vematgroup.com

## Architecture

| Élément | Technologie | Hébergement |
|---|---|---|
| Site et portails (`artifacts/vemat`) | React, Vite, Tailwind, Wouter, TanStack Query | Cloudflare Pages (dépôt « portail », branche `main`) |
| API (`artifacts/api-server`) | Express : e-mails de formulaires, assistant, catalogues internes | Google Cloud Run |
| Données et comptes | Supabase (projet « Vemat web gestion ») | Supabase |
| Bibliothèques partagées (`lib/`) | Types, validation | — |

Portails internes : technicien (`/espace-technicien`), pièces de rechange PDR (`/espace-pdr`), service après-vente SAV (`/espace-sav`).

## Commandes

```bash
pnpm install
pnpm --filter @workspace/vemat dev      # site en local
pnpm --filter @workspace/vemat build    # construction (sortie : artifacts/vemat/dist/public)
```

## Règles de travail

- Tout ce qui arrive sur la branche `main` du dépôt connecté à Cloudflare est publié automatiquement : pas de publication sans accord de la direction.
- Aucun fichier de plus de 25 Mo dans `artifacts/vemat/public` (limite Cloudflare Pages).
- Aucun mot de passe, clé ni jeton dans le dépôt. Les scripts d'administration lisent leurs secrets dans des fichiers locaux ignorés par git.
- Base de données : voir `supabase/README.md`.
