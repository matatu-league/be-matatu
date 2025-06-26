# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install
COPY . .

# Expose port (match what your server listens to)
EXPOSE 3000

# Start app
CMD ["node", "server.js"]
