# ==========================================
# Etapa 1: Compilación de la aplicación React
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar definiciones de dependencias
COPY frontend/package*.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY frontend/ ./

# Argumento para la URL del API (por defecto relativa para aprovechar el proxy Nginx)
ARG VITE_API_BASE=""
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

# ==========================================
# Etapa 2: Servidor Nginx de Producción
# ==========================================
FROM nginx:alpine

# Copiar artefactos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración optimizada de Nginx con proxy inverso
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

