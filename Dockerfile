# ==========================================
# Fase 1: Build / Compilación
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# ==========================================
# Fase 2: Runtime de Producción
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_FILE=/app/data/groceries_db.json

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev

# Copiar bundle compilado y datos base
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/groceries_db.json ./groceries_db.json

# Crear directorio de datos persistentes
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
