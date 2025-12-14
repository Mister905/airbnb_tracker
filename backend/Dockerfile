FROM node:20-alpine

WORKDIR /app

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

# Expose port
EXPOSE 3001

# For development, use start:dev
# For production, uncomment the build and start:prod commands
CMD ["npm", "run", "start:dev"]
