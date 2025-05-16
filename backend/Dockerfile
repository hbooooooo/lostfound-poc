# Use the official Node.js image
FROM node:18

# Create and set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose the backend port
EXPOSE 3000

# Start the backend
CMD ["npm", "run", "dev"]
