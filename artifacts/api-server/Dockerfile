FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

WORKDIR /app/artifacts/api-server

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "--env-file-if-exists=.env.local", "--enable-source-maps", "./dist/index.mjs"]
