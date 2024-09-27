#!/bin/sh

while true; do
    if nc -z -w 5 $DB_HOST $DB_PORT; then
        echo "Successfully connected to DB"
        break
    else
        echo "Failed to connect to DB. Retrying in 10 seconds..."
        sleep 10
    fi
done

php /var/www/html/artisan migrate --isolated --force
php /var/www/html/artisan config:clear
php /var/www/html/artisan config:cache
php /var/www/html/artisan cache:clear
supervisord -c /etc/supervisord.conf
