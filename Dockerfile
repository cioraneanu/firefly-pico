FROM composer:latest AS composer_base
FROM alpine:latest AS build-container

ARG REPO=https://github.com/cioraneanu/firefly-pico.git
ARG BRANCH=main

# Installing composer
COPY --from=composer_base /usr/bin/composer /usr/local/bin/composer

#Install packages
RUN apk add --no-cache \
    tar \
    nginx \
    nodejs \
    npm \
    supervisor \
    git \
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
    php82-tokenizer
RUN ln -s /usr/bin/php82 /usr/bin/php

#Pull Firefly-Pico from repo
WORKDIR /var/www/html
RUN git init
RUN git remote add origin ${REPO}
RUN git config core.sparseCheckout true
RUN echo "back/" >> .git/info/sparse-checkout
RUN echo "front/" >> .git/info/sparse-checkout
RUN git pull origin ${BRANCH}
RUN mv ./back/* ./
RUN rm -rf /back
COPY docker/.env .
RUN apk del git

#Configure backend
WORKDIR /var/www/html
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader
RUN php artisan key:generate
RUN tar --owner=www-data --group=www-data --exclude=.git -czf /tmp/app-back.tar.gz .

#Configure frontend
WORKDIR /var/www/html/front
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

FROM alpine:latest
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
    php82-tokenizer
RUN ln -s /usr/bin/php82 /usr/bin/php

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
RUN mkdir -p /tmp/nginx/
RUN chown \
   -R :www-data \
   /tmp/nginx
RUN chmod \
   -R 772 \
   /tmp/nginx
RUN chown \
   -R :www-data \
   /var/www/html/storage
RUN chmod \
   -R 772 \
   /var/www/html/storage

# Configure supervisor
RUN mkdir -p /etc/supervisor.d/
COPY docker/conf/supervisor/supervisord.conf /etc/supervisord.conf
COPY docker/conf/supervisor/php-fpm.ini /etc/supervisor.d/php-fpm.ini
COPY docker/conf/supervisor/node.ini /etc/supervisor.d/node.ini
COPY docker/conf/supervisor/cron.ini /etc/supervisor.d/cron.ini
COPY docker/conf/supervisor/nginx.ini /etc/supervisor.d/nginx.ini

# Configure PHP
RUN mkdir -p /run/php/
RUN touch /run/php/php8.2-fpm.pid
RUN mkdir -p /etc/php82/php-fpm.d
RUN rm /etc/php82/php-fpm.conf
COPY docker/conf/php-fpm/php-fpm.conf /etc/php82/php-fpm.conf
COPY docker/conf/php-fpm/www.conf /etc/php82/php-fpm.d/www.conf

# Configure nginx
COPY docker/conf/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/conf/nginx/default.conf /etc/nginx/http.d/default.conf

# Configure entrypoint
RUN mkdir -p /docker-entrypoint.d
COPY docker/docker-entrypoint.d/start.sh /docker-entrypoint.d/start.sh
RUN chmod +x /docker-entrypoint.d/*

#Cleanup
COPY docker/cleanup.sh .
RUN chmod +x ./cleanup.sh
RUN ./cleanup.sh
RUN rm ./cleanup.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.d/start.sh"]
CMD ["run"]