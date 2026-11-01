# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Snapshot

Firefly Pico is a Firefly III companion app with two separate front ends: a Vant mobile app and a dedicated desktop app, for fast transaction entry, dashboards, icons, tags, templates, profiles, piggy banks, recurring transactions, and assistant-assisted expense logging.

**Environment Requirements:** Node.js 18+ and PHP 8.2+.

**Key versions:** Nuxt 4 (SSR disabled), Vue 3.4+ (`defineModel()`), Vant 4 (mobile UI), Tailwind v4 (utility classes), Laravel 12, Pinia 3 (composition API stores). All source files are `.js`/`.vue` — NOT TypeScript despite `tsconfig.json` existing.

The repo is split into:

- `front/`: Nuxt/Vue single-page PWA. Uses Vue 3 script setup, Pinia, Vant (mobile), Tailwind (desktop kit), Tabler icons, VueUse, i18n, SVGO, and local UI-kit components.
- `back/`: Laravel API. Mostly proxies Firefly III endpoints, while storing Pico-only extra fields and resources in its own database (SQLite by default).
- `docker/` and `docker-compose*.yml`: production/container runtime setup for Pico alone or Pico plus Firefly III.
- `docs/`: images and public-facing documentation assets.

## Directory Map

```
front/
├── core/               # UI-agnostic logic shared by the mobile and desktop apps
│   ├── composables/    # useForm, useList, useTransactionForm, ... (no Vant, no DOM)
│   ├── repository/     # API data access classes (extend BaseRepository)
│   ├── models/         # Domain object shapes (extend BaseModel)
│   ├── transformers/   # API ↔ form data conversion (extend ApiTransformer)
│   ├── stores/         # Pinia state (useLocalStorage for persistence)
│   ├── constants/      # RouteConstants, TablerIconConstants, enums
│   └── utils/          # Pure utilities (VueUtils.js has generateChildren)
├── mobile/             # The Vant mobile app
│   ├── pages/          # File-based routing (Nuxt `dir.pages`)
│   │   └── {entity}/
│   │       ├── list.vue    # List page using useList() composable
│   │       └── [[id]].vue  # Form page using useForm() composable (create + edit)
│   ├── components/
│   │   ├── ui-kit/     # Reusable primitives (wrap Vant components)
│   │   │   └── theme/  # Themed wrappers (toolbars, save/delete buttons)
│   │   └── global/     # Auto-registered global components
│   ├── composables/    # Mobile-only hooks (useToolbar, useActionSheet, swipe/tap helpers)
│   ├── layouts/
│   └── styles/
│       ├── variables.css   # :root and .van-theme-dark custom properties
│       ├── theme-white.css # Main theme + Vant overrides
│       └── theme-dark.css  # Dark mode overrides
├── desktop/            # The desktop app (own routes, shell, d-* UI kit)
│   ├── routes.js       # Desktop route table, swapped in by router.options.js
│   ├── settings-sections.js # Settings sections (code, i18n key, icon, component)
│   ├── desktop-app.vue # Shell: sidebar, header, NuxtPage, toaster, confirm, loading bar
│   ├── pages/          # One page per entity (list + route-driven dialog), dashboard, settings, ramble
│   ├── components/
│   │   ├── ui/         # Kit primitives: button, input, select, popover, dialog, sheet, field, form, ...
│   │   ├── select/     # Domain selects (account, category, tag, budget, currency, icon, enum)
│   │   ├── dialogs/    # Entity edit dialogs built on d-form-dialog
│   │   ├── transactions/ dashboard/ settings/ layout/
│   ├── composables/    # useDesktopUI, useRouteDialog, useSearch, useDesktopNav, ...
│   └── styles/desktop.css # Desktop tokens (--d-*), resets, table + transition classes
├── shared/components/  # Components both apps render identically (app-icon)
├── router.options.js   # Picks the mobile (file-based) or desktop route table at startup
├── i18n/locales/       # 12 files: en, ro, zh-CN, it, pt-BR, de-DE, fr, pl, ru-RU, es-MX, ko, el
├── assets/             # Shared icons, images, tailwind.css (Tailwind v4 entry), animations.css
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
- Prefer existing helpers, constants, repositories, stores, transformers, and UI-kit components over one-off logic. Before writing a utility, check `front/core/utils/` — it likely already exists (`DateUtils`, `NumberUtils`, `UIUtils`, `ResponseUtils`, etc.).
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
- Do NOT add `<style scoped>` to components. Prioritize Tailwind utility classes or adding CSS to `theme-white.css`.
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

## Mobile vs Desktop

- `core/utils/UIModeUtils.js` decides once at startup: `localStorage.uiMode` (`auto` | `desktop` | `mobile`, editable in both apps' UI settings via `useUIMode()`), where `auto` = wide viewport with a fine pointer and hover. Changing it reloads the app.
- `app.vue` renders `mobile/mobile-app.vue` or `desktop/desktop-app.vue`; `router.options.js` swaps in `desktop/routes.js`. Both apps keep the same URLs and `RouteConstants`, so links, drill-downs and redirects work in both.
- Business logic lives in `core/`. Each mobile page and its desktop counterpart wire the same core composable (`useTagForm`, `useAccountForm`, `useTransactionList`, `useTransactionEditor`, `useDashboardBars`, ...). When a screen needs new logic, add it to the core composable, never to only one UI.
- `UIUtils` toasts and confirms delegate to the active app (`mobile/utils/MobileUI.js` or `DesktopUI` in `desktop/composables/useDesktopUI.js`).
- The mobile theme CSS stays global (`nuxt.config` `css`) so Vant's component CSS keeps its load order; `desktop/styles/desktop.css` resets the few global rules it needs under `.d-app` / `.d-portal`.

## Page Recipes

Every mobile entity screen follows the same two-page shape. Copy an existing entity (e.g. `mobile/pages/categories/`) instead of inventing structure.

**Form page (`mobile/pages/{entity}/[[id]].vue`)** — handles both create and edit:

- Root `<div class="app-form">` containing `<app-top-toolbar>`, then `<van-form :name="formName" @submit="saveItem" @failed="onValidationError">` with fields inside `<van-cell-group inset>`.
- Wire everything through `useForm({ routeList, routeForm, model, resetFields, fetchItem, onEvent })` — it provides `item`, `itemId`, `saveItem`, `onDelete`, `onNew`, `onValidationError`, `formName`.
- Bind fields to `item` sub-paths with `generateChildren(item, [{ computed: 'name', parentKey: 'attributes.name' }])` from `VueUtils` — never hand-write per-field computeds.
- Validation rules come from `rule` in `core/utils/ValidationUtils.js` (e.g. `:rules="[rule.required()]"`).
- Buttons: `<app-button-form-save />` and `<app-button-form-delete v-if="itemId" @click="onDelete" />`.
- Finish with `useToolbar().init({ title: itemId.value ? t('..._page.title_edit') : t('..._page.title_add'), backRoute })`.
- Sync the entity store in `onEvent` on `onPostSave` / `onPostDelete`.

**List page (`mobile/pages/{entity}/list.vue`)**:

- Root `<div :class="formClass">` (adds `empty` when list is empty) with `<app-top-toolbar>` + `<app-button-list-add @click="onAdd" />`, `<empty-list v-if="isEmpty" />`, then `<van-pull-refresh>` wrapping `<van-list>` with a `{entity}-list-item` per row.
- Wire through `useList({ routeList, routeForm, model, onEvent })`.
- Store-backed lists set `isFinished.value = true` in `onLoadMore` and refresh via the store's `fetch{Entity}()`.
- Optional client-side search: `<app-list-search v-model="search" />` + a `filteredList` computed.
- Call `animateSwipeList(list)` and `useToolbar().init(...)` at the end.

**Desktop entity page (`desktop/pages/{entities}.vue`)** — one route `/{entities}/:id?` (`list` = list only, no id = new, numeric = edit):

- `d-page` (title, description, `#actions` with `d-refresh-button` + primary `d-button :to="ROUTE_..._ID"`), `d-search` + `d-list`/`d-list-item` (or a `.d-table`), `d-empty` when empty.
- `const { id, isOpen } = useRouteDialog(ROUTE_..._LIST)` and `<d-{entity}-dialog v-if="isOpen" :key="id" />`.
- The dialog (`desktop/components/dialogs/`) is `d-form-dialog` + `d-field`s over `reactive(use{Entity}Form({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))`.

**Adding a whole new entity** (front to back):

1. `back/`: model in `app/Models`, controller extending `BaseControllerFirefly` (constructor calls `parent::__construct('/api/v1/{firefly-endpoint}', Model::class)` — often the whole class), `RouteUtils::makeCRUD('{entities}', Controller::class)` in `routes/api.php`, migration if Pico stores extra fields.
2. `front/`: model extending `BaseModel` (with `getTransformer()`, `getRepository()`, `getEmpty()`, static display helpers), repository extending `BaseRepository`, transformer extending `ApiTransformer` (`transformFromApi` / `transformToApi`), store following the store pattern below, a core `use{Entity}Form` composable on `useEntityForm`, the two mobile pages and the desktop page + dialog above, routes in `RouteConstants.js` and `desktop/routes.js`, i18n keys in all 12 locale files, entry points in the mobile extras page and `useDesktopNav`.

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

- Components are auto-imported with `pathPrefix: false` — use `<category-list-item>`, not `<list-items-category-list-item>`. Desktop components get the `D` prefix: `desktop/components/ui/button.vue` is `<d-button>`.
- Mobile UI-kit components (`app-field`, `app-select`, etc.) wrap Vant components. Desktop never uses Vant components or mobile components; it composes `d-*` components.
- Components use `defineModel()` for v-model binding.
- Nuxt is configured as `ssr: false`; treat the app as a purely client-side PWA. Do not create or use Nuxt `server/api/` routes.
- Data access goes through classes in `front/core/repository`, usually extending `BaseRepository`.
- Domain shape lives in `front/core/models`, transformation in `front/core/transformers`, app-wide state in `front/core/stores`, and reusable behavior in `front/core/composables`. Nothing in `core/` may import Vant or a component.
- Mobile: use CSS variables and theme files in `front/mobile/styles`. Desktop: use the token utilities (`bg-bg`, `bg-card`, `bg-pop`, `bg-soft`, `text-fg`, `text-dim`, `border-line`, `border-field`, `ring-ring`, `bg-primary`/`text-on-primary`, `text-danger`, `text-income`/`text-expense`/`text-transfer`). Check both light and dark theme impact.
- Never hard code labels in HTML. Use i18n from `front/i18n/locales`. When adding a key, update ALL 12 locale files: `en.json`, `ro.json`, `zh-CN.json`, `it.json`, `pt-BR.json`, `de-DE.json`, `fr.json`, `pl.json`, `ru-RU.json`, `es-MX.json`, `ko.json`, `el.json`. Keys use **underscores** for word separation and **dots** for nesting (e.g., `category_page.title_edit`).
- Icons come from Tabler constants (`TablerIconConstants.js`), SVG components (via nuxt-svgo from `assets/icons/`), or Vant built-in icons. Use `TablerIconConstants` for new icons. Avoid adding a new icon system.
- Routes should be mirrored through `front/core/constants/RouteConstants.js` where app navigation depends on constants.

### UI Feedback and Interaction

- Toasts and dialogs go through `UIUtils` (`showToastSuccess`, `showToastError`, `showDeleteConfirmation`) — never call Vant's `showToast`/`showDialog` directly from pages.
- Deletes always require `UIUtils.showDeleteConfirmation(...)` first.
- Use Tailwind v4 utilities (`flex items-center`, `gap-2`, `mt-2.5`, `text-12`, `font-semibold`, `truncate`) before writing new CSS. Tailwind runs in `important` mode so utilities beat Vant's own styles. Spacing is the default 4px scale (`mt-2.5` = 10px); font sizes use the px tokens `text-10`…`text-20` from `assets/styles/tailwind.css`; `dark:` targets `.van-theme-dark`. Bootstrap and `helper.css` were removed — don't reintroduce their class names (`display-flex`, `mt-10`, `text-size-12`, …).
- Navigation uses `navigateTo(RouteConstants.ROUTE_...)`, not raw path strings or `router.push`.

### UI Design Language

Read this before generating any UI so new screens look like they belong. The mobile app feels like a polished native mobile finance app (Vant-based); the desktop app follows the shadcn "nova" look (see **Desktop design language** below).

**Overall feel**

- Compact, information-dense, small type: titles 14px/600–700, subtitles 12–13px/400, section headers 14px 600 UPPERCASE, micro-badges 10–11px. Body font is the system stack (`ui-sans-serif, system-ui, ...`) — no custom fonts.
- Everything is a soft rounded rectangle: cells/cards 6–10px radius, buttons and inputs 5–10px, amount pills 25px. No sharp corners anywhere.
- Depth comes from soft layered shadows, not borders: signature shadows are `rgba(149,157,165,0.2) 0 8px 24px` (toolbars/sidebar), `rgba(0,0,0,0.24) 0 3px 8px` (buttons/floating elements), and hairline `0 0 0 1px` rings on bars/tabs. Tailwind shadow tokens `shadow-depth1..5`, `shadow-soft-1` exist in `tailwind.css`.
- Dashed 1px borders are the visual code for "add / optional / informational" affordances (`.app-card-info`, `.add-attachment`, `.suggestion-button`, `.currency-dropdown`, `.badge`).
- Scrollbars are hidden globally. Interactive cards use `user-select: none`. Almost every icon is a Tabler icon at 14–20px with stroke ~1.5–2, including a leading icon on nearly every form field and list-item subtitle row.

**Layout**

- **Mobile** (`mobile/layouts/default.vue`): fixed top `van-nav-bar` (centered bold 14px title, optional grey 12px subtitle, left back-arrow), scrollable content, fixed bottom `van-tabbar` with 5 items — Dashboard, Transactions, a center red rounded-square "+" button that pokes above the bar, Extras, Settings (11px labels, selected item blue `#1565C0`). Safe-area insets (`env(safe-area-inset-*)`) are respected top and bottom. A blue (`#1E88E5`) profile-picker floating button hugs the right edge (rounded on the left side only). The tabbar hides when the on-screen keyboard is up.
- Content max widths: forms/cards use Vant inset groups (16px side margins); the dashboard uses CSS-columns masonry (`.dynamic-masonry`, `column-width: 500px`) so cards flow into 1 column on mobile.

**Color**

- All colors live as CSS custom properties in `mobile/styles/variables.css` with light values on `:root` and dark overrides on `.van-theme-dark`. `--white`/`--black` intentionally invert in dark mode — use them for "surface" and "ink", not literal colors.
- Transaction-type semantics (used consistently in dots, pills, borders, charts): expense = pink `#ec407a` (`--expense1..3`), income = green `#66bb6a` (`--income1..3`), transfer = light blue `#4fc3f7` (`--transfer1..3`). Amounts render as white-text pills: `.amount-expense` (`#ef5350`) / `.amount-income` (`#66bb6a`).
- Primary action green `#00a261` (`--primary-action`) for add/confirm accents; Vant primary buttons are solid black in light mode and green in dark mode. General accent blue `#1E88E5`/`#1976D2`/`#42a5f5` marks profile UI, attachments, "today", links.
- Neutral surfaces: page bg `--van-background`, input/field bg `--van-background-2-5` (`#f7f8fa` light / `#2f2f2f` dark), muted text `#999`/`#aaa` or `--van-text-color-3`.
- Filter chips and "applied" states are near-black `#333` pills with white 12px text.

**Recurring component patterns**

- **Forms** (`useForm()` pages): root `div.app-form` (large bottom padding for the floating button), `van-form` > `van-cell-group inset`. Every input is a ui-kit wrapper (`app-field`, `app-select`, `app-date`, `app-boolean`, ...) rendering a Vant cell: label on the left (shared `10.5em` label column), a leading Tabler icon, and the input body as a grey rounded box (bg `--van-background-2-5`, radius 5px, padding 8px 12px). Save is `app-button-form-save`: a floating round black pill button — full-width fixed above the tabbar (rides up with the keyboard). Delete is a secondary button below the save, never beside it.
- **Lists** (`useList()` pages): `van-pull-refresh` + `van-list` infinite scroll. Each row is a `van-swipe-cell` — tap to edit, swipe left to reveal a full-height red Delete button. Row anatomy: optional 30px icon column, middle column with `.list-item-title` (14px/700) and icon-prefixed `.list-item-subtitle` lines (13px, grey), right column right-aligned with amount pill, date, and muted relative time. Small outlined `.tag` chips wrap in a 5px-gap flex row. Empty states are a centered faded icon + 12px grey text (`.empty-list`). Filtering opens from a toolbar search icon; active filters appear as dark chips in a white sticky `.applied-filters-container` bar.
- **Dashboard**: masonry of cards, each a `van-cell-group inset` with an uppercase `.van-cell-group-title`; stat tiles are `van-grid` cells (icon above 12px title above bold value, value colored by semantic type). Month is changed by horizontal swipe (animated slide) or the sticky date control; pull-to-refresh reloads. Users can reorder/hide cards, and cards respect feature toggles from `profileStore` (`tagsEnabled`, `budgetsEnabled`, ...) — new UI for an optional feature must check those.
- **Feedback**: toasts via `van-notify` (`.app-toast`) — full-width top banner. Blocking loads use `app-loading` (centered white rounded card + spinner over a dim overlay); background syncs use `app-bottom-loading` (small bordered pill, bottom-left, above the tabbar).
- **Motion**: subtle and short. Page transitions 0.15s fade+blur (`app.vue`), transition classes in `animations.css` (`zoom-fade`, `fade`), anime.js helpers in `core/utils/AnimationUtils.js` (save button pop, list stagger, dashboard month slide). Gate non-trivial animation behind `profileStore.showAnimations`.

**Dark theme**

- Toggled at runtime via `<van-config-provider :theme>` adding `.van-theme-dark` — not `prefers-color-scheme`. Any new class with hardcoded light colors needs a matching `.van-theme-dark` override in `theme-dark.css` (this is the established pattern; check both themes for every UI change).
- Dark surfaces: cells `#1c1c1e`–`#2a2a2a`, borders `#444`/`#666`, links light blue `#03a9f4`. Semantic pink/green/blue stay the same but text on colored pills flips to black; primary buttons turn green `#00a261`.

**Mobile cohesion checklist**: compose from Vant + existing ui-kit wrappers; put styles in `theme-white.css` (+ dark override) using the CSS variables and Tailwind utilities (`flex items-center`, `gap-*`, `text-12`, `font-semibold`) rather than scoped styles; 6–10px radius + soft shadow; a Tabler icon on every field/row; small text; i18n every label.


### Desktop design language

- shadcn/ui "nova" look: neutral oklch tokens (`--d-*` in `desktop/styles/desktop.css`, mapped to Tailwind colors in `assets/styles/tailwind.css`), 14px/20px system font, `text-xl font-semibold` page titles with a `text-sm text-dim` description, `text-base font-medium` card/dialog titles.
- Shell: 16rem sidebar on `bg-side` (brand, black "New transaction" button with `N` shortcut, grouped nav from `useDesktopNav`, sync row, profile menu) + an inset `bg-bg rounded-xl shadow-sm` content panel with a sticky breadcrumb header (sidebar toggle, `route.meta.crumb`, theme toggle).
- Surfaces are `rounded-xl bg-card ring-1 ring-fg/10` (cards, lists, tables); controls are `h-8 rounded-lg border-field`; popovers `bg-pop rounded-lg shadow-md ring-1 ring-fg/10`; dashed `d-info` boxes for "info / quick links" inside dialogs.
- Editing happens in dialogs over the list (`d-dialog`/`d-form-dialog`, footer `bg-soft/50` with Delete on the left, Cancel + primary Save on the right); bulk filters live in a right `d-sheet`; destructive actions go through `UIUtils.showDeleteConfirmation` (alert dialog); feedback is a bottom-right toast.
- Forms are horizontal rows: `d-field` (label column `--label-w`, default 9rem) wrapping one control; validation via `:rules` + `:value` on `d-field` inside `d-form` (same `rule` helpers as mobile).
- Transaction types: dots/pills/amounts use `expense` / `income` / `transfer` colors; income amounts are green with `+`, transfers dim, expenses `−`.
- Overlays teleport to `#d-portal` (created by the shell, carries the tokens and dark class). Tailwind runs in `important` mode, so inline `display: none` loses to utilities: use `v-if`/`v-show` wrappers, and never stack two conflicting utilities for one property (give the component a prop instead).
- Dark mode: tokens switch under `.van-theme-dark .d-app` / `.d-portal.van-theme-dark`; only add `dark:` variants where the design differs (outline buttons, inputs `dark:bg-field/30`).

**Desktop cohesion checklist**: build from `d-*` components and core composables; no Vant, no mobile components, no `<style>`; tokens over hex values; `d-page` + card/list/table surfaces; edit in route-driven dialogs; a Tabler icon on rows and actions; i18n every label; check light and dark.

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
- For UI work, inspect the affected screens in both apps (set `localStorage.uiMode` or use a narrow/touch viewport for mobile) and in both themes.

## Data And Configuration

- Do not commit secrets, real Firefly tokens, personal database credentials, or local `.env` values.
- Docker compose examples contain placeholder credentials and paths. Preserve that style unless the user asks for a real deployment file.
- Be careful around local storage settings in the front end, especially auth token, backend URL, profiles, sync settings, and dashboard preferences.

## Collaboration Defaults

- If the request is implementation-oriented, make the change and verify it instead of stopping at a proposal.
- If requirements are ambiguous but the safe path is obvious, choose the conservative repo-native option and mention the assumption.
- If a change could affect user data, auth, migrations, proxy behavior, or Docker deployment, slow down and call out the risk.
- Leave the workspace cleaner than you found it, but do not "clean up" unrelated files.
