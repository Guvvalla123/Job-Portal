# Stage 1: Build (optional - for future native deps)
FROM node:20-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
