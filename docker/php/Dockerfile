FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpq-dev \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        bcmath \
        zip \
        intl \
        pcntl \
        mbstring \
        opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY php.ini /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www/html

RUN groupmod -g 1000 www-data && usermod -u 1000 www-data

USER www-data
