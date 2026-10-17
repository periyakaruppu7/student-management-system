
# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Stage 2: Install backend dependencies
FROM node:22-alpine AS backend-deps

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev


# Stage 3: Production image
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "server.js"]
