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
- Prefer existing helpers, constants, repositories, stores, transformers, and UI-kit components over one-off logic.
- Follow naming conventions: `PascalCase` for Vue components (`MyComponent.vue`) and PHP classes, and `camelCase` for JS/TS composables and utilities (`useMyFeature.js`).
- When behavior touches both `front/` and `back/`, trace the full flow: route constant, page/component, repository, backend route/controller/model/migration if applicable.
- Validate the narrowest thing that proves the change, then broaden only when risk warrants it.

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

### UI Design Language

Read this before generating any UI so new screens look like they belong. The app feels like a polished native mobile finance app (Vant-based), with a newer "slate" desktop shell around it.

**Overall feel**

- Compact, information-dense, small type: titles 14px/600–700, subtitles 12–13px/400, section headers 14px 600 UPPERCASE, micro-badges 10–11px. Body font is the system stack (`ui-sans-serif, system-ui, ...`) — no custom fonts.
- Everything is a soft rounded rectangle: cells/cards 6–10px radius, buttons and inputs 5–10px, amount pills 25px. No sharp corners anywhere.
- Depth comes from soft layered shadows, not borders: signature shadows are `rgba(149,157,165,0.2) 0 8px 24px` (toolbars/sidebar), `rgba(0,0,0,0.24) 0 3px 8px` (buttons/floating elements), and hairline `0 0 0 1px` rings on bars/tabs. Helpers `shadow-depth1..5`, `shadow-soft-1` exist in `helper.css`.
- Dashed 1px borders are the visual code for "add / optional / informational" affordances (`.app-card-info`, `.add-attachment`, `.suggestion-button`, `.currency-dropdown`, `.badge`).
- Scrollbars are hidden globally. Interactive cards use `user-select: none`. Almost every icon is a Tabler icon at 14–20px with stroke ~1.5–2, including a leading icon on nearly every form field and list-item subtitle row.

**Layout: mobile vs desktop**

- The switch is `appStore.isDesktopLayout` = window width > 800px AND a desktop device (`useDevice()`), NOT a CSS media query. Components branch in the template (`v-if="appStore.isDesktopLayout"`); many have separate mobile/desktop variants (e.g. `transaction-list-item.vue` vs `transaction-list-item-desktop.vue`, `app-top-toolbar` renders `van-nav-bar` on mobile vs a floating card on desktop). New UI must handle both branches.
- **Mobile** (`layouts/default.vue`): fixed top `van-nav-bar` (centered bold 14px title, optional grey 12px subtitle, left back-arrow), scrollable content, fixed bottom `van-tabbar` with 5 items — Dashboard, Transactions, a center red rounded-square "+" button that pokes above the bar, Extras, Settings (11px labels, selected item blue `#1565C0`). Safe-area insets (`env(safe-area-inset-*)`) are respected top and bottom. A blue (`#1E88E5`) profile-picker floating button hugs the right edge (rounded on the left side only). The tabbar hides when the on-screen keyboard is up.
- **Desktop**: fixed left sidebar, 15rem wide, full height; content gets `padding-inline-start: 16.25rem`. The sidebar is the newer Tailwind-flavored "slate" aesthetic (rem units, slate hex comments): white surface, `#e2e8f0` right border, nav links 0.875rem/500 in slate-500 `#64748b` that hover/activate to slate-100 bg + slate-900 text, uppercase 0.75rem slate-400 section labels, collapsible sections persisted in localStorage. Top of sidebar: full-width black (`#0f172a`, hover `#1e293b`) "New transaction" button. Bottom: profile picker, theme toggle, Settings. Pages get a sticky floating toolbar card (`.app-top-toolbar-desktop`: white, 10px radius, 15px padding/margin, soft shadow, `top: 10px`) instead of the nav-bar.
- Content max widths: forms/cards use Vant inset groups (16px side margins); the dashboard uses CSS-columns masonry (`.dynamic-masonry`, `column-width: 500px`) so cards flow into 1 column on mobile and 2–3 on desktop.

**Color**

- All colors live as CSS custom properties in `assets/styles/variables.css` with light values on `:root` and dark overrides on `.van-theme-dark`. `--white`/`--black` intentionally invert in dark mode — use them for "surface" and "ink", not literal colors.
- Transaction-type semantics (used consistently in dots, pills, borders, charts): expense = pink `#ec407a` (`--expense1..3`), income = green `#66bb6a` (`--income1..3`), transfer = light blue `#4fc3f7` (`--transfer1..3`). Amounts render as white-text pills: `.amount-expense` (`#ef5350`) / `.amount-income` (`#66bb6a`).
- Primary action green `#00a261` (`--primary-action`) for add/confirm accents; Vant primary buttons are solid black in light mode and green in dark mode. General accent blue `#1E88E5`/`#1976D2`/`#42a5f5` marks profile UI, attachments, "today", links.
- Neutral surfaces: page bg `--van-background`, input/field bg `--van-background-2-5` (`#f7f8fa` light / `#2f2f2f` dark), muted text `#999`/`#aaa` or `--van-text-color-3`.
- Filter chips and "applied" states are near-black `#333` pills with white 12px text.

**Recurring component patterns**

- **Forms** (`useForm()` pages): root `div.app-form` (large bottom padding for the floating button), `van-form` > `van-cell-group inset`. Every input is a ui-kit wrapper (`app-field`, `app-select`, `app-date`, `app-boolean`, ...) rendering a Vant cell: label on the left (shared `10.5em` label column), a leading Tabler icon, and the input body as a grey rounded box (bg `--van-background-2-5`, radius 5px, padding 8px 12px). Save is `app-button-form-save`: a floating round black pill button — full-width fixed above the tabbar on mobile (rides up with the keyboard), fixed 200px at bottom-right 50px on desktop. Delete is a secondary button below the save, never beside it.
- **Lists** (`useList()` pages): `van-pull-refresh` + `van-list` infinite scroll. Each row is a `van-swipe-cell` — tap to edit, swipe left to reveal a full-height red Delete button. Row anatomy: optional 30px icon column, middle column with `.list-item-title` (14px/700) and icon-prefixed `.list-item-subtitle` lines (13px, grey), right column right-aligned with amount pill, date, and muted relative time. Small outlined `.tag` chips wrap in a 5px-gap flex row. Empty states are a centered faded icon + 12px grey text (`.empty-list`). Filtering opens from a toolbar search icon; active filters appear as dark chips in a white sticky `.applied-filters-container` bar.
- **Dashboard**: masonry of cards, each a `van-cell-group inset` with an uppercase `.van-cell-group-title`; stat tiles are `van-grid` cells (icon above 12px title above bold value, value colored by semantic type). Month is changed by horizontal swipe (animated slide) or the sticky date control; pull-to-refresh reloads. Users can reorder/hide cards, and cards respect feature toggles from `profileStore` (`tagsEnabled`, `budgetsEnabled`, ...) — new UI for an optional feature must check those.
- **Feedback**: toasts via `van-notify` (`.app-toast`) — full-width top banner on mobile, repositioned to a bottom-left 360px rounded card on desktop. Blocking loads use `app-loading` (centered white rounded card + spinner over a dim overlay); background syncs use `app-bottom-loading` (small bordered pill, bottom-left, above the tabbar).
- **Motion**: subtle and short. Page transitions 0.15s fade+blur (`app.vue`), transition classes in `animations.css` (`zoom-fade`, `fade`), anime.js helpers in `utils/AnimationUtils.js` (save button pop, list stagger, dashboard month slide). Gate non-trivial animation behind `profileStore.showAnimations`.

**Dark theme**

- Toggled at runtime via `<van-config-provider :theme>` adding `.van-theme-dark` — not `prefers-color-scheme`. Any new class with hardcoded light colors needs a matching `.van-theme-dark` override in `theme-dark.css` (this is the established pattern; check both themes for every UI change).
- Dark surfaces: cells `#1c1c1e`–`#2a2a2a`, sidebar `#111`, borders `#444`/`#666`, links light blue `#03a9f4`. Semantic pink/green/blue stay the same but text on colored pills flips to black; primary buttons turn green `#00a261`.

**Cohesion checklist for new UI**: branch mobile/desktop via `appStore.isDesktopLayout`; compose from Vant + existing ui-kit wrappers; put styles in `theme-white.css` (+ dark override) using the CSS variables and helper classes (`flex-center-vertical`, `gap-*`, `text-size-*`, `font-weight-*`) rather than scoped styles; 6–10px radius + soft shadow; a Tabler icon on every field/row; small text; i18n every label.



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
