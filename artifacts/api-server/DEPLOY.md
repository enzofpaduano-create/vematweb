# Deploy API Server

Cette API sert le chatbot Vemat, l'envoi des notifications de formulaires (`/api/notify`) et l'accès aux catalogues techniques (`/api/catalogues`, réservé DG / manager / technicien).

## Variables d'environnement

- `PORT`
- `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL` : assistant de chat
- `CORS_ORIGIN` : origines autorisées, séparées par des virgules. Si vide, seules `https://www.vematgroup.com` et `https://vematgroup.com` sont acceptées.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` : clé publique uniquement, jamais la clé de service
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_MASTER`, `MAIL_TO_PDR`, `MAIL_TO_SAV` : e-mails
- `MAIL_ALLOWED_DOMAINS` : domaines autorisés comme destinataires de validation (défaut `vematgroup.com`)

Exemple (sans valeurs secrètes) :

```bash
PORT=3001
OPENAI_CHAT_MODEL=gpt-5.4-mini
CORS_ORIGIN=https://www.vematgroup.com,https://vematgroup.com
MAIL_ALLOWED_DOMAINS=vematgroup.com
```

Les mots de passe et clés se saisissent dans la console du fournisseur (Cloud Run, secrets), jamais dans le dépôt.

## Option 1 : service qui accepte Docker

Le plus simple est d'utiliser le `Dockerfile` de [api-server/Dockerfile](/Users/enzopaduano/Desktop/vematweb/artifacts/api-server/Dockerfile).

- contexte de build : racine du repo `vematweb`
- fichier Docker : `artifacts/api-server/Dockerfile`
- port exposé : `3001`

## Option 2 : lancement manuel

Depuis la racine du repo :

```bash
pnpm install
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

## Vérification

Une fois déployée, l'API doit répondre sur :

```bash
GET /api/healthz
```

et renvoyer :

```json
{"status":"ok"}
```

## Branchement du front

Dans le front Vemat, ajoute :

```bash
VITE_API_BASE_URL=https://ton-api.example.com
```

Si `VITE_API_BASE_URL` n'est pas défini, le chatbot continue de fonctionner en fallback local sur le catalogue embarqué.
