# ── Stage: production image ─────────────────────────────────────────────
FROM node:20-alpine
 
# Create app directory
WORKDIR /data
 
# Install dependencies first (cached layer)
COPY app/package*.json ./
RUN npm ci --omit=dev
 
# Copy application source
COPY app/ .
 
# Run as non-root user and ensure data dir is writable
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /data
USER appuser
 
EXPOSE 3000
CMD ["node", "notes.js"]
