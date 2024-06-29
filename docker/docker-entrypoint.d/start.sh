#!/bin/sh

php /var/www/html/artisan migrate --isolated --force
php /var/www/html/artisan config:clear
php /var/www/html/artisan config:cache
php /var/www/html/artisan cache:clear
supervisord -c /etc/supervisord.conf