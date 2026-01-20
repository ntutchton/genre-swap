FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# 2. Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copy rest of the app
COPY . .

# 4. Fix permissions for Next.js dev output
RUN mkdir -p .next && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]
