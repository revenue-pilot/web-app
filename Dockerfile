# Stage 1: Build base & dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/database/package*.json ./packages/database/

# Install Chromium for Puppeteer and skip its own download
RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN npm ci

# Stage 2: Generate database client & build
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build

# Stage 3: Runner for Next.js Web Frontend
FROM node:20-alpine AS web-runner
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start", "--workspace=web"]

# Stage 4: Runner for Backend NestJS API
FROM node:20-alpine AS api-runner
WORKDIR /app
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/packages/database ./packages/database
EXPOSE 3001
ENV NODE_ENV=production
CMD npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma && node apps/api/dist/main

