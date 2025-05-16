FROM node:18

WORKDIR /app

# Copy full package manifest first
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
ENV NODE_ENV=development
RUN npm install

# Copy everything else
COPY . .

# Double-check Tailwind presence before running the dev server
RUN [ -d node_modules/tailwindcss ] && echo "✅ Tailwind installed" || (echo "❌ Tailwind missing" && exit 1)

# Expose Vite dev server
EXPOSE 5173

# Start the Vite dev server
CMD ["npm", "run", "dev", "--", "--host"]
