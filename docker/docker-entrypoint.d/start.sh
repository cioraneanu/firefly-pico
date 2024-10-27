#!/bin/sh

if [ "$DB_CONNECTION" == "sqlite" ]; then
    echo "Using a SQLite database"
else
    while true; do
        # Check if $DB_HOST is a Unix socket (starts with "/")
        if echo "$DB_HOST" | grep -q "^/"; then
            # Unix socket connection
            if [ -S "$DB_HOST" ]; then
                echo "Successfully connected to DB via Unix socket: $DB_HOST"
                break
            else
                echo "Failed to connect to DB via Unix socket: $DB_HOST. Retrying in 10 seconds..."
            fi
        else
            # TCP connection
            if nc -z -w 5 $DB_HOST $DB_PORT; then
                echo "Successfully connected to DB via TCP: $DB_HOST:$DB_PORT"
                break
            else
                echo "Failed to connect to DB via TCP: $DB_HOST:$DB_PORT. Retrying in 10 seconds..."
            fi
        fi

        # Wait before retrying
        sleep 10
    done
fi

php /var/www/html/artisan migrate --isolated --force
php /var/www/html/artisan config:clear
php /var/www/html/artisan config:cache
php /var/www/html/artisan cache:clear
supervisord -c /etc/supervisord.conf
