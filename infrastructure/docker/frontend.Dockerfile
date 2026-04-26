FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY frontend/ .

EXPOSE 5173

# Ensure Vite listens on 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
