# Deploy API Server

Cette API sert le chatbot Vemat.

## Variables d'environnement

- `PORT`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `CORS_ORIGIN`

Exemple :

```bash
PORT=3001
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-5.4-mini
CORS_ORIGIN=https://vemat.netlify.app,https://ton-domaine.com
```

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
