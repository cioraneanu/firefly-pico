# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Snapshot

Firefly Pico is a mobile-first Firefly III companion app for fast transaction entry, dashboards, icons, tags, templates, profiles, piggy banks, recurring transactions, and assistant-assisted expense logging.

**Environment Requirements:** Node.js 18+ and PHP 8.2+.

**Key versions:** Nuxt 3 (SSR disabled), Vue 3.4+ (`defineModel()`), Vant 4 (mobile UI), Laravel 12, Pinia 3 (composition API stores). All source files are `.js`/`.vue` — NOT TypeScript despite `tsconfig.json` existing.

The repo is split into:

- `front/`: Nuxt/Vue single-page PWA. Uses Vue 3 script setup, Pinia, Vant, Tabler icons, VueUse, i18n, SVGO, and local UI-kit components.
- `back/`: Laravel API. Mostly proxies Firefly III endpoints, while storing Pico-only extra fields and resources in its own database (SQLite by default).
- `docker/` and `docker-compose*.yml`: production/container runtime setup for Pico alone or Pico plus Firefly III.
- `docs/`: images and public-facing documentation assets.

## Directory Map

```
front/
├── pages/              # File-based routing (Nuxt)
│   └── {entity}/
│       ├── list.vue    # List page using useList() composable
│       └── [[id]].vue  # Form page using useForm() composable (create + edit)
├── components/
│   ├── ui-kit/         # Reusable primitives (wrap Vant components)
│   │   └── theme/      # Themed wrappers (toolbars, save/delete buttons)
│   └── global/         # Auto-registered global components
├── composables/        # useXxx() hooks (useForm, useList, useToolbar, etc.)
├── repository/         # API data access classes (extend BaseRepository)
├── models/             # Domain object shapes (extend BaseModel)
├── transformers/       # API ↔ form data conversion (extend ApiTransformer)
├── stores/             # Pinia state (useLocalStorage for persistence)
├── constants/          # RouteConstants, TablerIconConstants, enums
├── i18n/locales/       # 10 files: en, ro, zh-CN, it, pt-BR, de-DE, fr, pl, ru-RU, es-MX
├── assets/styles/      # CSS variables, themes, helper classes
│   ├── variables.css   # :root and .van-theme-dark custom properties
│   ├── theme-white.css # Main theme + Vant overrides
│   └── theme-dark.css  # Dark mode overrides
├── utils/              # Pure utilities (VueUtils.js has generateChildren)
└── plugins/            # Axios setup (auto-adds auth header)
back/
├── routes/api.php      # Route registration (makeCRUD + catch-all Firefly proxy)
├── app/Http/Controllers/
│   └── Base/           # BaseControllerFirefly (Firefly proxy engine)
├── app/Models/         # Firefly-shadowed (BaseModel) + Pico-owned
├── app/Validations/    # Static validation classes (NOT FormRequest)
├── app/Authorizations/ # Static authorization classes
├── app/Helpers/        # Global fget/fset/fcollect helpers (autoloaded)
└── database/migrations/
```

## Working Style
- Always make the least necessary changes. Keep code as short as possible, with the clearest, and easiest-to-read implementation.
- Read the nearby code before editing. This project has strong local patterns; follow them instead of introducing new architecture.
- Keep changes small and directly connected to the request. Avoid drive-by refactors, formatting churn, or dependency updates unless they are part of the task.
- Protect user work. Check `git status --short` before larger edits and never overwrite unrelated modified files.
- Prefer existing helpers, constants, repositories, stores, transformers, and UI-kit components over one-off logic. Before writing a utility, check `front/utils/` — it likely already exists (`DateUtils`, `NumberUtils`, `UIUtils`, `ResponseUtils`, etc.).
- A new feature should be mostly declarative glue over existing building blocks (`useForm()`, `useList()`, `generateChildren()`, UI-kit components). If you are writing many lines of imperative logic for a CRUD page, you are off-pattern.
- Prefer `computed` over `watch`; prefer store dictionaries (`categoryDictionary`, `tagDictionary`, …) over `.find()` scans for id lookups.
- Do not create abstractions, props, or options for hypothetical future use. Do not generalize a component used in one place.
- Follow naming conventions: `PascalCase` for Vue components (`MyComponent.vue`) and PHP classes, `camelCase` for JS composables and utilities (`useMyFeature.js`), `kebab-case` for UI-kit/page component filenames (`app-field.vue`, `category-list-item.vue`).
- When behavior touches both `front/` and `back/`, trace the full flow: route constant, page/component, repository, backend route/controller/model/migration if applicable.
- Validate the narrowest thing that proves the change, then broaden only when risk warrants it.

## Code Style & Formatting

Prettier is the source of truth (`front/.prettierrc`). Write code that already matches it so diffs stay clean:

- Single quotes, **no semicolons**, trailing commas, 2-space indent, `printWidth: 200` (don't wrap lines early).
- Run `npm run lint:fix` from `front/` after JS/Vue changes; `vendor/bin/pint` is for PHP but only when formatting is part of the task.
- Plain JavaScript only — no TypeScript syntax, no JSDoc type annotations, even though `tsconfig.json` exists.
- Vue SFC order is `<template>` then `<script setup>`. No `<style>` blocks (see pitfalls).
- The codebase uses `let` liberally even for non-reassigned locals; either is fine — do not "fix" existing declarations.

## Common Pitfalls (Do NOT)

- Do NOT access entity data as `item.name` — use `get(item, 'attributes.name')`. All entities follow JSON:API shape: `{ id, type, attributes: { ... } }`.
- Do NOT create Nuxt `server/api/` routes — this is `ssr: false`, all data goes through the Laravel API.
- Do NOT use Options API — always `<script setup>`.
- Do NOT add `<style scoped>` to components. Prioritize using CSS helper classes or adding CSS to `theme-white.css`.
- Do NOT use `modelValue` prop + emit — use `defineModel()`.
- Do NOT use standard Laravel controller method names — use `getOne`/`getAll`/`create`/`update`/`delete` (NOT `index`/`show`/`store`/`destroy`).
- Do NOT create FormRequest classes — use static Validation classes in `App\Validations\`.
- Do NOT use `data_get()`/`data_set()`/`collect()` — use `fget()`/`fset()`/`fcollect()` from `app/Helpers/Helpers.php`.
- Do NOT add auth middleware — there is none. Auth works by forwarding the Bearer token to Firefly III.
- Do NOT add npm or composer dependencies without asking.
- Do NOT use `lodash` — use `lodash-es` (tree-shakeable). Use `import { get } from 'lodash-es'`.
- Do NOT use try/catch for API errors — axios errors resolve (not reject). Check with `ResponseUtils.isSuccess(response)`.
- Do NOT import components manually — they are auto-imported with `pathPrefix: false`.
- Do NOT build form/list page logic from scratch — use `useForm()` and `useList()` composables.
- Do NOT modify existing migration files — create new ones.
- Do NOT use `moment` or `dayjs` — use `date-fns`.
- Do NOT use native fetch or `$fetch` — use the repository layer (which uses axios).

## Page Recipes

Every entity screen follows the same two-page shape. Copy an existing entity (e.g. `pages/categories/`) instead of inventing structure.

**Form page (`pages/{entity}/[[id]].vue`)** — handles both create and edit:

- Root `<div class="app-form">` containing `<app-top-toolbar>`, then `<van-form :name="formName" @submit="saveItem" @failed="onValidationError">` with fields inside `<van-cell-group inset>`.
- Wire everything through `useForm({ routeList, routeForm, model, resetFields, fetchItem, onEvent })` — it provides `item`, `itemId`, `saveItem`, `onDelete`, `onNew`, `onValidationError`, `formName`.
- Bind fields to `item` sub-paths with `generateChildren(item, [{ computed: 'name', parentKey: 'attributes.name' }])` from `VueUtils` — never hand-write per-field computeds.
- Validation rules come from `rule` in `utils/ValidationUtils.js` (e.g. `:rules="[rule.required()]"`).
- Buttons: `<app-button-form-save />` and `<app-button-form-delete v-if="itemId" @click="onDelete" />`.
- Finish with `useToolbar().init({ title: itemId.value ? t('..._page.title_edit') : t('..._page.title_add'), backRoute })`.
- Sync the entity store in `onEvent` on `onPostSave` / `onPostDelete`.

**List page (`pages/{entity}/list.vue`)**:

- Root `<div :class="formClass">` (adds `empty` when list is empty) with `<app-top-toolbar>` + `<app-button-list-add @click="onAdd" />`, `<empty-list v-if="isEmpty" />`, then `<van-pull-refresh>` wrapping `<van-list>` with a `{entity}-list-item` per row.
- Wire through `useList({ routeList, routeForm, model, onEvent })`.
- Store-backed lists set `isFinished.value = true` in `onLoadMore` and refresh via the store's `fetch{Entity}()`.
- Optional client-side search: `<app-list-search v-model="search" />` + a `filteredList` computed.
- Call `animateSwipeList(list)` and `useToolbar().init(...)` at the end.

**Adding a whole new entity** (front to back):

1. `back/`: model in `app/Models`, controller extending `BaseControllerFirefly` (constructor calls `parent::__construct('/api/v1/{firefly-endpoint}', Model::class)` — often the whole class), `RouteUtils::makeCRUD('{entities}', Controller::class)` in `routes/api.php`, migration if Pico stores extra fields.
2. `front/`: model extending `BaseModel` (with `getTransformer()`, `getRepository()`, `getEmpty()`, static display helpers), repository extending `BaseRepository`, transformer extending `ApiTransformer` (`transformFromApi` / `transformToApi`), store following the store pattern below, the two pages above, routes in `RouteConstants.js`, i18n keys in all 10 locale files, an entry point (menu/extras page) for navigation.

## Common Commands

Front end:

```bash
cd front
npm install
npm run dev
npm run build
npm run lint
npm run lint:fix
```

Back end:

```bash
cd back
composer install
php artisan serve
php artisan test
vendor/bin/pint
```

Docker examples from the repo root:

```bash
docker compose -f docker-compose.pico.yml up
docker compose -f docker-compose.pico+firefly.yml up
```

Use the command that matches the scope of the change. Do not run expensive Docker builds unless the task needs container validation.

## Front-End Notes


### Store Patterns

- Stores use composition API (`defineStore('name', () => { ... })`), NOT options API.
- Most state uses `useLocalStorage()` from VueUse for persistence.
- Each entity store typically has: `{entity}List` ref, `isLoading{Entity}` ref, `{entity}Dictionary` computed (keyed by id), and `fetch{Entity}()` method.
- Call `useAppStore()` / `useProfileStore()` **inside functions**, not at module top level (Pinia initialization order).
- Many list pages load ALL data into stores via `syncEverything()` and display from the store rather than paginating from the API.

### Component and Import Conventions

- Components are auto-imported with `pathPrefix: false` — use `<category-list-item>`, not `<list-items-category-list-item>`.
- UI-kit components (`app-field`, `app-select`, etc.) wrap Vant components (`van-field`, `van-cell`, etc.).
- Components use `defineModel()` for v-model binding.
- Nuxt is configured as `ssr: false`; treat the app as a purely client-side PWA. Do not create or use Nuxt `server/api/` routes.
- Data access goes through classes in `front/repository`, usually extending `BaseRepository`.
- Domain shape lives in `front/models`, transformation in `front/transformers`, app-wide state in `front/stores`, and reusable behavior in `front/composables`.
- Keep the app mobile-first while preserving desktop layout paths such as `appStore.isDesktopLayout`.
- Use CSS variables and existing theme files in `front/assets/styles` for colors and spacing. Check both light and dark theme impact.
- Never hard code labels in HTML. Use i18n from `front/i18n/locales`. When adding a key, update ALL 10 locale files: `en.json`, `ro.json`, `zh-CN.json`, `it.json`, `pt-BR.json`, `de-DE.json`, `fr.json`, `pl.json`, `ru-RU.json`, `es-MX.json`. Keys use **underscores** for word separation and **dots** for nesting (e.g., `category_page.title_edit`).
- Icons come from Tabler constants (`TablerIconConstants.js`), SVG components (via nuxt-svgo from `assets/icons/`), or Vant built-in icons. Use `TablerIconConstants` for new icons. Avoid adding a new icon system.
- Routes should be mirrored through `front/constants/RouteConstants.js` where app navigation depends on constants.

### UI Feedback and Interaction

- Toasts and dialogs go through `UIUtils` (`showToastSuccess`, `showToastError`, `showDeleteConfirmation`) — never call Vant's `showToast`/`showDialog` directly from pages.
- Deletes always require `UIUtils.showDeleteConfirmation(...)` first.
- `front/assets/styles/helper.css` has utility classes (`display-flex`, `flex-center`, `flex-1`, spacing like `mt-10`/`p-1`, `opacity-*`) — reach for those before writing new CSS.
- Navigation uses `navigateTo(RouteConstants.ROUTE_...)`, not raw path strings or `router.push`.

## Back-End Notes

### Controllers and Routing

- Proxied entities extend `BaseControllerFirefly` and are often just a constructor: `parent::__construct('/api/v1/{endpoint}', Model::class)`. Only add methods for Pico-specific behavior.
- Register routes with `RouteUtils::makeCRUD('{entities}', Controller::class)` — it wires `getOne`/`getAll`/`create`/`update`/`delete`. Unmatched routes fall through to the catch-all Firefly proxy.
- Validation lives in static classes under `App\Validations\`, authorization under `App\Authorizations\`.

### Global Helpers

`app/Helpers/Helpers.php` is autoloaded and defines functions used everywhere:
- `fget($var, 'dot.path', $default)` — use instead of `data_get()`.
- `fset(&$arr, 'dot.path', $value)` — use instead of `data_set()`.
- `fcollect($var)` — smart `collect()` wrapper.
- `getAuthTokenHash()` — SHA-256 of the bearer token for user scoping.
- `getUser()` — verifies token by calling Firefly III's user endpoint.

### Other

- Keep Firefly proxy behavior transparent unless a task explicitly requires Pico-specific enrichment.
- Prefer request/response shapes that match Firefly III and the current repositories, so the front end stays thin.

## Testing And Verification

- For front-end changes, run `npm run lint` and `npm run build` from `front/` when feasible.
- For backend PHP changes, run `php artisan test` or the relevant PHPUnit target from `back/`.
- Run `vendor/bin/pint` only when PHP formatting is part of the task or the touched files clearly need it.
- For localized JSON changes, parse the changed JSON files before finishing.
- For UI work, manually inspect the affected mobile and desktop states when possible.

## Data And Configuration

- Do not commit secrets, real Firefly tokens, personal database credentials, or local `.env` values.
- Docker compose examples contain placeholder credentials and paths. Preserve that style unless the user asks for a real deployment file.
- Be careful around local storage settings in the front end, especially auth token, backend URL, profiles, sync settings, and dashboard preferences.

## Collaboration Defaults

- If the request is implementation-oriented, make the change and verify it instead of stopping at a proposal.
- If requirements are ambiguous but the safe path is obvious, choose the conservative repo-native option and mention the assumption.
- If a change could affect user data, auth, migrations, proxy behavior, or Docker deployment, slow down and call out the risk.
- Leave the workspace cleaner than you found it, but do not "clean up" unrelated files.
