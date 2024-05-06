# Installation

## 1. Docker (recommended)

For convince Pico comes with a prebuilt docker image which you can spin up. 
1. Pick the docker compose that fits your needs:
- [Pico only](../docker-compose.pico.yml) (If you already have Firefly installed)
- [Pico + Firefly](../docker-compose.pico+firefly.yml) (If you want an easy 2 in 1)

2. Set `FIREFLY_URL` to the URL of your Firefly instance. <br>**Important!** Make sure you provide the host + port of Firefly instance ex. `http://192.168.1.10:8080` or `https://firefly.domain.com` if you have if proxied through something like Nginx.
3. Make sure you set values to ALL envs named `DB_PASSWORD` + `POSTGRES_PASSWORD` (and that they match for PicoApp <-> PicoDB, and Firefly <-> Firefly DB )
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
2. Copy the .env.example file to .env and fill with your own database.
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

1. Open Firefly and create your first login account (if you haven't used Firefly before).

2. Inside Firefly enable your desired currencies and mark one as default.

3. Go to "Options" -> "Profile" -> OAuth -> Create New Personal Access Token. Save this token somewhere safe.

4. Open Firefly-Pico , go to Settings -> App Config and paste the token from the step above.