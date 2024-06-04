#!/bin/sh

php /var/www/html/artisan migrate --isolated --force
supervisord -c /etc/supervisord.conf