# Build stage
FROM node:20.11.1-alpine3.19 AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache curl python3 make g++

# Copy package files first
COPY package*.json ./

# Install dependencies with npm install instead of npm ci
RUN npm install

# Copy the rest of the application code
COPY . .

# Production stage
FROM node:20.11.1-alpine3.19

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create app directory and set permissions
WORKDIR /app

# Create necessary directories and set permissions
RUN mkdir -p /app/public /app/server /app/config /app/data /app/js /app/References \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy application files from builder
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public/
COPY --from=builder /app/server ./server/
COPY --from=builder /app/config ./config/
COPY --from=builder /app/data ./data/
COPY --from=builder /app/js ./js/
COPY --from=builder /app/References ./References/
COPY --from=builder /app/server.js ./

# Fix permissions
RUN chown -R appuser:appgroup /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3333

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3333/health || exit 1

# Start the application
CMD ["node", "server.js"]
