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
FROM oven/bun:1.3.14 AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOME=/home/codex \
    CODEX_HOME=/home/codex/.codex \
    PATH="/root/.bun/bin:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends bubblewrap \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun add --global @openai/codex
RUN bun install --frozen-lockfile --production
RUN mkdir -p /home/codex/.codex && chmod -R 777 /home/codex

COPY tsconfig.json ./
COPY --from=build /app/src ./src
VOLUME ["/app/data"]
CMD ["bun", "run", "src/index.ts"]
