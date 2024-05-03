ARG REGISTRY=docker.io/stsdockerhub
ARG LARAVEL_ALPINE_VERSION=8.3.2-laravel-alpine3.19

FROM ${REGISTRY}/php:${LARAVEL_ALPINE_VERSION}-build as build-container

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
    && npm run build \
    && tar --owner=www-data --group=www-data --exclude=.git -czf /tmp/app-front.tar.gz .


# ================================

FROM ${REGISTRY}/php:${LARAVEL_ALPINE_VERSION}-build

WORKDIR /var/www/html

COPY --from=build-container /tmp/app-back.tar.gz .

RUN tar -xf app-back.tar.gz \
    && rm -rf app-back.tar.gz

WORKDIR /var/www/html/front

COPY --from=build-container /tmp/app-front.tar.gz .

RUN tar -xf app-front.tar.gz \
    && rm -rf app-front.tar.gz


COPY docker/conf/supervisor/node.ini /etc/supervisor.d
COPY docker/conf/nginx/default.conf /etc/nginx/http.d


# Configure entrypoint
COPY docker/docker-entrypoint.d /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*