FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other dependencies required by Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Prisma CLI
RUN npm install -g prisma

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Make startup script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 3001

# Use startup script for production (runs migrations then starts app)
CMD ["./start.sh"]
