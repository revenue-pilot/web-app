FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copy package management files
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/

RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install dependencies
RUN npm install

# Copy source code
COPY apps/api ./apps/api
COPY packages/database ./packages/database

# Build
RUN cd packages/database && npx prisma generate
RUN cd apps/api && npm run build

FROM node:18-alpine AS production
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/api/node_module[s] ./apps/api/node_modules
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/packages/database ./packages/database


ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/src/main.js"]
