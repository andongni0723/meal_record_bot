FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpm prisma:generate

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

CMD ["sh", "-c", "pnpm prisma:migrate:deploy && node dist/index.js"]
