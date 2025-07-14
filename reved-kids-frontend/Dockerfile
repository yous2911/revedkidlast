# Stage 1: Build the React application
FROM node:18-alpine AS build

# Add build arguments for environment
ARG NODE_ENV=production
ARG REACT_APP_API_URL
ARG REACT_APP_VERSION

# Set environment variables
ENV NODE_ENV=$NODE_ENV
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_VERSION=$REACT_APP_VERSION

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production --frozen-lockfile && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application with optimizations
RUN npm run build && \
    # Remove source maps in production (optional)
    find build -name "*.map" -delete && \
    # Remove unnecessary files
    rm -rf src public

# Stage 2: Production nginx server
FROM nginx:1.25-alpine AS production

# Install security updates and wget for health checks
RUN apk update && apk upgrade && \
    apk add --no-cache wget curl && \
    rm -rf /var/cache/apk/*

# Create nginx user for security
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Copy built application
COPY --from=build --chown=nginx:nginx /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf

# Create required directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /etc/nginx

# Security: Remove default nginx files
RUN rm -rf /etc/nginx/conf.d/default.conf

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check with proper endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
