FROM node:22-slim AS base
WORKDIR /app

# Install system dependencies for native modules (bcrypt, etc.)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Copy source
COPY . .

# Build frontend + backend
RUN npm run build

# Production stage
FROM node:22-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=base /app/dist ./dist

# pdf-parse reads a test file at module load — create empty stub
RUN mkdir -p test/data && touch test/data/05-versions-space.pdf

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
