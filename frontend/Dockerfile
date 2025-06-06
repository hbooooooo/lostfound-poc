FROM node:18

WORKDIR /app

# Copy full package manifest first
COPY package*.json ./

# Install ALL dependencies explicitly with NODE_ENV
RUN npm install --include=dev


# Copy everything else
COPY . .

# Double-check Tailwind presence before running the dev server
RUN [ -d node_modules/tailwindcss ] && echo "✅ Tailwind installed" || (echo "❌ Tailwind missing" && exit 1)

# Expose Vite dev server
EXPOSE 4173

# Start the Vite dev server
CMD ["npx", "vite", "--host", "--port", "4173"]

