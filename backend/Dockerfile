FROM node:20-alpine

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

EXPOSE 4000

# We set the default command, but docker-compose can override it
CMD ["npm", "run", "start"]
