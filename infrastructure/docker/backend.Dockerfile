FROM node:22-alpine

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies first for better caching
COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy Prisma schema from centralized infrastructure folder
COPY infrastructure/database/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy the rest of the application
COPY backend/ .

# Build the application
RUN npm run build

EXPOSE 5000

# For development, we'll keep using npm run dev if that's the intention, 
# but for production-ready dockerization, we typically use the built files.
# Given the user's dev environment, we'll stick to 'npm run dev'.
CMD ["npm", "run", "dev"]
