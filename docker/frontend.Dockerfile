# Stage 1: Build stage (Bun)
FROM oven/bun:1-alpine AS build-stage

WORKDIR /app

COPY package*.json bun.lock* ./

RUN bun install

COPY . .

RUN bun run build

# Stage 2: Production stage (Nginx)
FROM nginx:stable-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Custom nginx config to handle SPA routing if needed
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
