#!/bin/sh

echo "Configure app"
ENV_FILE="/var/www/html/.env"

#Set enviroment variables
sed -i -e 's|APP_ENV=.*$|APP_ENV='"${APP_ENV}"'|g' "$ENV_FILE"
sed -i -e 's|FIREFLY_URL=.*$|FIREFLY_URL='"${FIREFLY_URL}"'|g' "$ENV_FILE"
sed -i -e 's|APP_KEY=.*$|APP_KEY='"${APP_KEY}"'|g' "$ENV_FILE"
sed -i -e 's|DB_CONNECTION=.*$|DB_CONNECTION='"${DB_CONNECTION}"'|g' "$ENV_FILE"
sed -i -e 's|DB_HOST=.*$|DB_HOST='"${DB_HOST}"'|g' "$ENV_FILE"
sed -i -e 's|DB_PORT=.*$|DB_PORT='"${DB_PORT}"'|g' "$ENV_FILE"
sed -i -e 's|DB_DATABASE=.*$|DB_DATABASE='"${DB_DATABASE}"'|g' "$ENV_FILE"
sed -i -e 's|DB_USERNAME=.*$|DB_USERNAME='"${DB_USERNAME}"'|g' "$ENV_FILE"
sed -i -e 's|DB_PASSWORD=.*$|DB_PASSWORD='"${DB_PASSWORD}"'|g' "$ENV_FILE"
sed -i -e 's|APP_NAME=.*$|APP_NAME='"${APP_NAME}"'|g' "$ENV_FILE"
sed -i -e 's|PUSHER_APP_KEY=.*$|PUSHER_APP_KEY='"${PUSHER_APP_KEY}"'|g' "$ENV_FILE"
sed -i -e 's|PUSHER_HOST=.*$|PUSHER_HOST='"${PUSHER_HOST}"'|g' "$ENV_FILE"
sed -i -e 's|PUSHER_PORT=.*$|PUSHER_PORT='"${PUSHER_PORT}"'|g' "$ENV_FILE"
sed -i -e 's|PUSHER_SCHEME=.*$|PUSHER_SCHEME='"${PUSHER_SCHEME}"'|g' "$ENV_FILE"
sed -i -e 's|PUSHER_APP_CLUSTER=.*$|PUSHER_APP_CLUSTER='"${PUSHER_APP_CLUSTER}"'|g' "$ENV_FILE"

php /var/www/html/artisan migrate --isolated --force
supervisord -c /etc/supervisord.conf