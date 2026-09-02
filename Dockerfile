FROM php:8.2-fpm-bookworm

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    LARAVEL_PDF_CHROME_PATH=/usr/bin/chromium

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        chromium \
        curl \
        default-mysql-client \
        fonts-liberation \
        git \
        gnupg \
        libatk-bridge2.0-0 \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libnss3 \
        libpng-dev \
        libzip-dev \
        unzip \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        exif \
        gd \
        intl \
        opcache \
        pcntl \
        pdo_mysql \
        sockets \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-progress \
    && if [ -f package-lock.json ]; then npm ci; else npm install; fi \
    && npm run build \
    && npm prune --omit=dev \
    && mkdir -p storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/indotix-entrypoint
RUN chmod +x /usr/local/bin/indotix-entrypoint

ENTRYPOINT ["indotix-entrypoint"]
CMD ["php-fpm"]
