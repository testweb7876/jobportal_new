FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production deps
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs uploads

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["dumb-init", "node", "src/server.js"]
