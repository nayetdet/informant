# Base Image
FROM oven/bun:1.3.14 AS base
WORKDIR /app
COPY package.json bun.lock ./

# Deps Stage
FROM base AS deps
RUN bun install --frozen-lockfile

# Build Stage
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN bunx tsc --noEmit

# Runtime Stage
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PATH="/root/.bun/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bubblewrap \
        ca-certificates \
        nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun add --global @openai/codex
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY --from=build /app/src ./src
VOLUME ["/app/data"]
CMD ["bun", "run", "src/index.ts"]
