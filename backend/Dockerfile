FROM node:18-alpine

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

EXPOSE 5000

# For development, we'll keep using npm run dev if that's the intention, 
# but for production-ready dockerization, we typically use the built files.
# Given the user's dev environment, we'll stick to 'npm run dev'.
CMD ["npm", "run", "dev"]
