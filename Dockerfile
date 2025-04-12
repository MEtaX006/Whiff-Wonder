FROM node:18-alpine

WORKDIR /app

# Add build essentials for bcrypt and health check dependencies
RUN apk add --no-cache python3 make g++ wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all HTML files
COPY *.html ./

# Copy all JavaScript files
COPY *.js ./

# Copy CSS files
COPY *.css ./

# Copy JSON files
COPY *.json ./

# Create and copy References directory
RUN mkdir -p References
COPY References/*.* References/

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
