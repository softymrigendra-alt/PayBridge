FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

# ─── Build ──────────────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ─── Production image ────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

EXPOSE 3001
