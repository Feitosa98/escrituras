FROM node:18-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend ./backend
COPY dist ./dist
COPY server.cjs ./server.cjs

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.cjs"]
