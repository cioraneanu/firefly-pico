FROM composer:2.2 AS composer_base

#-----------------------------------------------------------------
FROM alpine:3.22 AS base

#Install packages
RUN apk add --no-cache \
    tar \
    nginx \
    nodejs \
    npm \
    supervisor \
    php82 \
    php82-session \
    php82-ctype \
    php82-fpm \
    php82-pdo \
    php82-opcache \
    php82-zip \
    php82-phar \
    php82-iconv \
    php82-cli \
    php82-curl \
    php82-openssl \
    php82-mbstring \
    php82-tokenizer \
    php82-fileinfo \
    php82-json \
    php82-xml \
    php82-xmlwriter \
    php82-simplexml \
    php82-dom \
    php82-pdo_mysql \
    php82-pdo_pgsql \
    php82-pdo_sqlite \
    php82-tokenizer
RUN ln -s /usr/bin/php82 /usr/bin/php

#-----------------------------------------------------------------
FROM base AS build-container

# Installing composer
COPY --from=composer_base /usr/bin/composer /usr/local/bin/composer

#Configure backend
WORKDIR /var/www/html
COPY back/ .
RUN mv .env.example .env

ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader
RUN php artisan key:generate
RUN tar --owner=www-data --group=www-data --exclude=.git -czf /tmp/app-back.tar.gz .

#Configure frontend
WORKDIR /var/www/html/front
COPY front/ .

RUN npm install \
    && npm run build
RUN npm prune --production
RUN npm cache clean --force
RUN tar --owner=www-data --group=www-data \
    --exclude=.git \
    --exclude=.nuxt \
    --exclude=.cache \
    --exclude=node_modules/eslint-plugin-vue \
    --exclude=node_modules/esbuild \
    --exclude=node_modules/date-fns \
    --exclude=node_modules/csso \
    --exclude=node_modules/node-gyp \
    --exclude=node_modules/vite \
    --exclude=node_modules/@npmcli \
    --exclude=node_modules/caniuse-lite \
    --exclude=node_modules/vite-plugin-inspect \
    --exclude=node_modules/@eslint \
    --exclude=node_modules/lodash \
    --exclude=node_modules/nuxi \
    --exclude=node_modules/@unocss \
    --exclude=node_modules/eslint* \
    --exclude=node_modules/@rollup \
    --exclude=node_modules/prettier \
    --exclude=node_modules/@esbuild \
    --exclude=node_modules/workbox-build \
    --exclude=node_modules/es-abstract \
    --exclude=node_modules/shiki \
    --exclude=node_modules/@nuxt \
    --exclude=node_modules/@typescript-eslint \
#     Temporarily. There's probably a bug in vue-router which references this dev plugin while in production mode
#    --exclude=node_modules/@vue/devtools* \
    --exclude=node_modules/vant \
    --exclude=node_modules/mathjs \
    --exclude=node_modules/typescript \
    --exclude=node_modules/@faker-js \
    --exclude=node_modules/@opentelemetry \
    node_modules/@babel/parser \
    --exclude=node_modules/@babel \
    --exclude=node_modules/@tabler \
    -czf /tmp/app-front.tar.gz .


#-----------------------------------------------------------------
FROM base

WORKDIR /var/www/html
RUN --mount=type=bind,from=build-container,source=/tmp/,target=/build \
    tar -xf /build/app-back.tar.gz -C .

WORKDIR /var/www/html/front
RUN --mount=type=bind,from=build-container,source=/tmp/,target=/build \
    tar -xf /build/app-front.tar.gz -C .

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "$(pwd)" \
    --ingroup www-data \
    --no-create-home \
    www-data

RUN mkdir -p -m 772 /tmp/nginx/ && chown -R www-data:www-data /tmp/nginx
RUN chmod -R 772 /var/www/html/storage && chown -R www-data:www-data /var/www/html/storage

# Configure supervisor
COPY docker/conf/supervisor/supervisord.conf /etc/supervisord.conf
COPY docker/conf/supervisor/ /etc/supervisor.d/

# Configure PHP
RUN mkdir -p /run/php/ && touch /run/php/php8.2-fpm.pid
COPY docker/conf/php-fpm/ /etc/php82/

# Configure nginx
COPY docker/conf/nginx/ /etc/nginx/

# Configure entrypoint
COPY --chmod=755 docker/docker-entrypoint.d/ /docker-entrypoint.d/

#set default db connection
ENV DB_CONNECTION=sqlite

ENTRYPOINT ["/docker-entrypoint.d/start.sh"]
CMD ["run"]
