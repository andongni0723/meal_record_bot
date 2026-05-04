FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN pnpm install --frozen-lockfile=false

COPY prisma ./prisma
RUN pnpm prisma:generate

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

CMD ["sh", "-c", "pnpm prisma:migrate:deploy && node dist/index.js"]
