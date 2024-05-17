# General rules
- Please provide a nice and positive attitude when writing issues. We are all doing this for fun. Please keep it that way :innocent:
- Don't create Pull Requests without opening an issue to discuss the benefits and implications.
- All Pull Requests should be performed on the `dev` branch.
- Don't be offended if a feature that you find necessary doesn't get approved. We have to keep a healthy balance between things that provides value to most users and bloating the UI / code.

## Frontend development
- Install [Node and NPM](https://nodejs.org/en)
- Setup a Pico backend to connect to. Either use your installed docker instance ((Install instructions)[./installation.md])
or spin up a local instance with the **Backend development** bellow

```
cd front
npm i
npm start
```


## Backend development
- Install PHP (>= 8.1)
- Install [Composer](https://getcomposer.org)
- Setup a database to connect to. Either use the one Pico already uses in Docker / spin up a new Docker image of Postgres / just use sqlite file.
```
cd back
composer i
cp .env.example .env
# Set FIREFLY_URL and DB_CONNECTION related values
php artisan serve
```






