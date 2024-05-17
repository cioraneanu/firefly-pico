# Installation

## 1. Docker (recommended)
0. The Firefly-Pico docker image comes in 2 flavors:
- **:latest** - Regular updates
- **:dev** - Latest features, frequent updates

1. Pick a docker-compose as a starting point:
- [Pico only](../docker-compose.pico.yml) (If you already have Firefly installed)
- [Pico + Firefly](../docker-compose.pico+firefly.yml) (If you want an easy 2 in 1)

2. Change `FIREFLY_URL` to the URL of your **Firefly** instance. If you don't use a reverse proxy make sure you provide the full ip+port. <br>Ex. `http://192.168.1.10:8080` or `https://firefly.domain.com`


3. Change `DB_PASSWORD` and `POSTGRES_PASSWORD` to something secure. **Make sure they match!** If you want separate passwords for Pico and Firefly make sure they match for `pico-app <-> pico-db`, and `firefly-app <-> firefly-db`


4. Start the container `docker compose -f docker-compose.yml up -d`

See configuration [3. Post install config](installation.md#3-post-install-config)

## 2. Manual installation

## 2.1. Requirements:

- NodeJS >= 20
- PHP >= 8.0
    - Required Extensions: Ctype, cURL, DOM, Fileinfo, Filter, Hash, Mbstring, OpenSSL, PCRE, PDO, Session, Tokenizer, XML.
- Git
- [Composer](https://getcomposer.org/) >= 2.0

## 2.2. Steps:

Clone the repository

```
git clone https://github.com/cioraneanu/firefly-pico
cd firefly-pico
```

Backend (Laravel):

1. `cd back`
2. Copy the `.env.example` file to `.env`. Set `FIREFLY_URL` + database config.
3. Run `composer install --no-dev`
4. Run `php artisan key:generate` to generate a unique application key
5. Run `php artisan migrate` to update the database.
6. Serve it.

   - Quick way: `php artisan serve`
   - Better way: You should have a Nginx/Apache web server up and configured it to serve `public/index.php`. You can read more here:
     [Laravel Deployment](https://laravel.com/docs/10.x/deployment).

Frontend (Nuxt):

1. `cd front`
2. Run `npm install`
3. Run `npm run build`
4. Serve it:

   - Quick way: `npm run prod`.
   - Better way: Set it up with PM2 as explained here [Nuxt deployment](https://nuxt.com/docs/getting-started/deployment#pm2)

## 3. Post install config

If you've used Firefly before skip to step 3.

1. Open **Firefly** and create your first login account.

2. Enable your desired currencies and mark one as default.

3. Go to `"Options" -> "Profile" -> OAuth -> Create New Personal Access Token`. Save this token somewhere safe.

4. Open **Pico** , go to `Settings -> App Config` and paste the token from the step above. In 99% of cases you don't need to change the `Pico Backend URL`. *DO NOT PUT FIREFLY URL HERE! :)*