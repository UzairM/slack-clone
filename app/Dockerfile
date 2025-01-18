FROM node:20-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0
ENV HUSKY_SKIP_INSTALL=1

# Copy package files
COPY package*.json ./

# Install dependencies with dev dependencies for build
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Expose port 80
EXPOSE 80

# Start the Next.js application
CMD ["npm", "run", "start", "--", "-p", "80"]


