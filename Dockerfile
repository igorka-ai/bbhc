FROM node:20-alpine AS builder
WORKDIR /app

# Install native build tools needed for better-sqlite3 (C++ module)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Install native build tools for better-sqlite3 in production stage too
RUN apk add --no-cache python3 make g++

# Install only production deps (better-sqlite3 recompiles here)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Create the data directory for the SQLite volume mount
RUN mkdir -p /data

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/data/bbhc.db

CMD ["node", "dist/index.cjs"]
