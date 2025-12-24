FROM node:22-slim AS base
RUN npm install -g pnpm@10.18.3

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY web/package.json ./web/

# Install all dependencies (including dev for build)
RUN pnpm install

# Copy source code
COPY server ./server
COPY web ./web

# Build (web + server, copies assets to server/dist/assets)
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

# Copy only production files from builder
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
