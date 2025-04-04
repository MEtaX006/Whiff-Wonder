FROM node:18-alpine

# Add build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Clean install dependencies
RUN npm ci --build-from-source

# Copy rest of the application
COPY . .

# Rebuild bcrypt specifically for Alpine
RUN npm rebuild bcrypt --build-from-source

EXPOSE 3000

CMD ["npm", "start"]
