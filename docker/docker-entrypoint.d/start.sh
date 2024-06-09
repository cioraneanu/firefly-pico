#!/bin/sh

php /var/www/html/artisan migrate --isolated --force
php /var/www/html/artisan config:clear
php /var/www/html/artisan config:cache
supervisord -c /etc/supervisord.conf