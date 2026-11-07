# Multi-stage Docker build for FarmLedger
FROM node:22-alpine AS builder

WORKDIR /app

# Build Client
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# Setup Server
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --no-optional

COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 5000

# Start server (automatically initializes/seeds SQLite database if not present)
CMD ["node", "server/index.js"]

