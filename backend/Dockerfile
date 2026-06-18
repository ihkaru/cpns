FROM dunglas/frankenphp:1-php8.3-alpine

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    oniguruma-dev \
    libxml2-dev

RUN docker-php-ext-install pdo pdo_pgsql pgsql zip bcmath mbstring xml

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory (FrankenPHP defaults to /app)
WORKDIR /app

# Set document root for Laravel
ENV FRANKENPHP_DOCUMENT_ROOT=/app/public

# Cache Composer dependencies (Best Practice Layer Caching)
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy the rest of the application files
COPY . .
RUN composer dump-autoload --optimize

# Set permissions for Laravel storage and bootstrap cache (FrankenPHP uses www-data user)
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache && \
    chmod -R 775 /app/storage /app/bootstrap/cache

# Expose ports (FrankenPHP listens on 80 and 443 by default)
EXPOSE 80
EXPOSE 443
EXPOSE 443/udp

# Copy and set entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Start FrankenPHP server using standard configuration
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
