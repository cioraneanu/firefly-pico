#!/bin/sh

#---------------------------------------------------------------------
# configurations
#---------------------------------------------------------------------

function app() {
  # Set env type
  ENV_FILE="/var/www/html/.env"
  sed -i -e 's|APP_ENV=.*$|APP_ENV='"${APP_ENV}"'|g' "$ENV_FILE"

  # Run migrations
  php /var/www/html/artisan migrate --isolated --force
}

#---------------------------------------------------------------------
# run configurations
#---------------------------------------------------------------------

echo "Configure app"
app
