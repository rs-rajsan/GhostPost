FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 5173

# Ensure Vite listens on 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
