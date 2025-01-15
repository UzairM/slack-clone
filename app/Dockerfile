FROM node:20-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0
ENV HUSKY_SKIP_INSTALL=1

# Copy package files and env file first
COPY package.json package-lock.json .env.production ./
RUN cp .env.production .env

# Install dependencies with dev dependencies for build
RUN npm pkg delete scripts.prepare && \
    NODE_ENV=development npm ci

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Expose port 80
EXPOSE 80

# Start the Next.js application
CMD ["npm", "run", "start", "--", "-p", "80"]


