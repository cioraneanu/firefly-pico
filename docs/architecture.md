## Tech
- Uses Laravel for REST API 
- Uses Nuxt for SPA frontend


## 🔒 Security
- Pico doesn't implement a separate layer for authorisation. Instead it proxies all requests over to Firefly's REST API which is responsible
for determining if an Authorisation header is valid or not. Even custom REST endpoints like "transaction templates"
are authorised by making a request to Firefly's `/about/user` first. This keeps things simple because we have a single
source of auth truth and it makes the user's life easier because he doesn't need to create another account over on Pico.


## How does it work?
- Firefly-Pico needs a few more columns for some of the tables. In order to achieve this it acts as a middleware for all requests to the
Firefly API. It has a separate DB in which it only keeps the Firefly primary key and the new columns (like icons).
<div align="center"><img src="images/architecture.png"></div>

- All app settings are stored in **localStorage** for fast availability and also persisted in the DB linked to your Access Token. This means that reusing the token on 2 devices will also sync your settings.   

- Tags, accounts, categories, budgets and templates are also stored in **localStorage**. They are resynced every `N days` which is configurable in `Settings`. You can manually resync them with a pull to refresh from the individual list, or resync everything via  `Settings -> App config -> Save`