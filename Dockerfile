FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Create the data directory for the SQLite volume mount
RUN mkdir -p /data

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/data/bbhc.db

CMD ["node", "dist/index.cjs"]
