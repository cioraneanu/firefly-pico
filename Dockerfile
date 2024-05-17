ARG REGISTRY=docker.io/stsdockerhub
ARG LARAVEL_ALPINE_VERSION=8.3.2-laravel-alpine3.19

FROM ${REGISTRY}/php:${LARAVEL_ALPINE_VERSION}-build as build-container

RUN docker-php-ext-install mysqli pdo pdo_mysql && docker-php-ext-enable pdo_mysql

WORKDIR /var/www/html

COPY back .

COPY back/.env.example .env


#RUN composer install --no-dev \
#    && php artisan key:generate \
#    && tar --owner=www-data --group=www-data --exclude=.git -czf /tmp/app-back.tar.gz .

ENV COMPOSER_ALLOW_SUPERUSER=1
#RUN rm -rf vendor/
RUN composer install --no-dev
RUN php artisan key:generate
#RUN php artisan migrate
RUN tar --owner=www-data --group=www-data --exclude=.git -czf /tmp/app-back.tar.gz .

# ================================

WORKDIR /var/www/html/front

COPY front .

#COPY front/.env.example .env


RUN npm install \
    && npm run build

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
    --exclude=node_modules/@vue/devtools* \
    --exclude=node_modules/vant \
    --exclude=node_modules/mathjs \
    --exclude=node_modules/typescript \
    --exclude=node_modules/@faker-js \
    --exclude=node_modules/@opentelemetry \
    node_modules/@babel/parser \
    --exclude=node_modules/@babel \
    --exclude=node_modules/@tabler \
    -czf /tmp/app-front.tar.gz .
    # ================================

    FROM ${REGISTRY}/php:${LARAVEL_ALPINE_VERSION}-build

    WORKDIR /var/www/html

    RUN --mount=type=bind,from=build-container,source=/tmp/,target=/build \
    tar -xf /build/app-back.tar.gz -C .

WORKDIR /var/www/html/front

RUN --mount=type=bind,from=build-container,source=/tmp/,target=/build \
    tar -xf /build/app-front.tar.gz -C .

COPY docker/conf/supervisor/node.ini /etc/supervisor.d
COPY docker/conf/nginx/default.conf /etc/nginx/http.d


# Configure entrypoint
COPY docker/docker-entrypoint.d /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*