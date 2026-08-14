FROM node:18-bookworm-slim AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:18-bookworm-slim AS runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend ./backend
COPY server.cjs ./server.cjs
COPY --from=frontend-builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.cjs"]
