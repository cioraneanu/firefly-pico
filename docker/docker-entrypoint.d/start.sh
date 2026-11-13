#!/bin/sh

# Render the nginx site config. NGINX_PORT lets users pick an unprivileged port on hosts
# where a non-root process may not bind port 80 (Synology Container Manager, podman, ...)
NGINX_PORT="${NGINX_PORT:-80}"
case "$NGINX_PORT" in
    ''|*[!0-9]*)
        echo "Invalid NGINX_PORT '$NGINX_PORT', falling back to 80"
        NGINX_PORT=80
        ;;
esac
sed "s/\${NGINX_PORT}/$NGINX_PORT/g" \
    /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf
echo "nginx will listen on port $NGINX_PORT"

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

# APP_KEY encrypts the API keys users save for the assistant. An APP_KEY given to the container always wins;
# otherwise one is generated on the first start and kept in the data folder (the SQLite volume) so upgrades keep it.
# A key Laravel can't use (the compose placeholder, a base64 key without "base64:") would break saving keys: ignore it.
if [ -n "$APP_KEY" ] && ! php -r '$k = getenv("APP_KEY"); if (str_starts_with($k, "base64:")) $k = base64_decode(substr($k, 7), true); exit(strlen((string)$k) === 32 ? 0 : 1);'; then
    echo "ERROR: APP_KEY must be 32 characters or \"base64:\" + 32 base64-encoded bytes (openssl rand -base64 32). Ignoring it."
    unset APP_KEY
fi
if [ -z "$APP_KEY" ]; then
    if [ "$DB_CONNECTION" != "sqlite" ]; then
        echo "WARNING: no valid APP_KEY set. Unless /var/www/html/database/data is a volume, the generated key is lost when the container is recreated and the assistant API keys users saved must be entered again."
    fi
    APP_KEY_FILE=/var/www/html/database/data/app_key
    if [ ! -s "$APP_KEY_FILE" ]; then
        mkdir -p "$(dirname "$APP_KEY_FILE")"
        php -r 'echo "base64:" . base64_encode(random_bytes(32));' > "$APP_KEY_FILE" && chmod 600 "$APP_KEY_FILE"
    fi
    export APP_KEY="$(cat "$APP_KEY_FILE")"
fi

php /var/www/html/artisan migrate --isolated --force
php /var/www/html/artisan config:clear
php /var/www/html/artisan config:cache
php /var/www/html/artisan cache:clear

mkdir -p /var/www/html/database/data

supervisord -c /etc/supervisord.conf
