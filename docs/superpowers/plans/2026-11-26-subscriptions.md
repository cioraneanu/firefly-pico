# Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Firefly III subscriptions (`bills`) as a full Pico entity: CRUD in both apps, linking from transactions / recurring transactions / templates, a transaction filter, cost totals and a month-following dashboard card.

**Architecture:** Same shape as piggy banks: Laravel proxy controller + icon-only model, a core model/repository/transformer/store/form composable, mobile `mx` pages and a desktop `d-*` page + dialog. Firefly computes paid/expected dates (`GET /bills?start=&end=`); Pico only reads them. Pure date/amount logic lives in one dependency-light util so it can be checked with plain `node`.

**Tech Stack:** Nuxt 4 / Vue 3 `<script setup>` / Pinia / Tailwind v4 / lodash-es / date-fns; Laravel 12 + SQLite.

**Spec:** `docs/superpowers/specs/2026-11-26-subscriptions-design.md`

## Global Constraints

- Follow `AGENTS.md`: plain JS, no semicolons, single quotes, `printWidth: 200`, `<template>` then `<script setup>`, no `<style>`, `defineModel()`, `get(item, 'attributes.x')`, lodash-es, date-fns, no try/catch for API calls, no manual component imports, no new npm/composer dependencies.
- UI name **Subscriptions**; front-end identifiers `Subscription`, `subscriptionStore`, `useSubscriptionForm`, `subscriptionsEnabled`, routes `/subscriptions/...`. Backend route and Firefly endpoint: **`bills`**.
- Every new label goes into **all 12** locale files (`en, ro, zh-CN, it, pt-BR, de-DE, fr, pl, ru-RU, es-MX, ko, el`); parse them after editing (`node -e "for (const f of require('fs').readdirSync('i18n/locales')) JSON.parse(require('fs').readFileSync('i18n/locales/'+f))"` from `front/`).
- `subscriptionsEnabled` default `false`; `budgetsEnabled` default changes `true` → `false`. Every subscription UI (nav, extras, form field, filters, dashboard card, settings card list) is hidden when `subscriptionsEnabled` is off, and `bill_id` is never sent then.
- Amounts shown in totals and on the dashboard card are converted into `dashboardStore.dashboardCurrency` with `convertCurrency(amount, fromCode, toCode)` (`core/utils/CurrencyUtils.js`).
- No front-end unit-test runner exists and adding one needs a new dependency, so verification is: `node` assertion one-liners for the pure util, `npm run lint`, `npm run build`, and driving the app in **demo mode** (`preview_start {name: 'front-dev'}`, start demo from the login screen) in both apps (`localStorage.uiMode = 'mobile' | 'desktop'`) and both themes.
- Commit steps run only if the user approved committing; otherwise skip them and leave the changes uncommitted in the working tree.

## Review Focus

1. **Editing a transaction with the feature off, or whose bill isn't in the store** → its Firefly link must survive (no `bill_id` sent when off; when on and the bill id isn't in `subscriptionDictionary`, send the original `bill_id` back). Pinned in Task 5.
2. **Weekly subscription in a month with 4 expected dates, 2 paid, one passed unpaid** → one row, state `missed`, `expected 4`, `paid 2`. Pinned in Task 2 node checks.
3. **Payment in a month with no expected date** (quarterly paid early) → one row, `paid`, `isOffSchedule: true`, counted in paid amount but not in "of Y". Pinned in Task 2.
4. **Subscription with `skip: 1` and `amount_min` ≠ `amount_max`** → monthly cost = average × factor ÷ 2. Pinned in Task 2.
5. **Changing the dashboard month quickly** → the card shows the last-requested month, not a stale earlier response. Pinned in Task 8 (request token guard).

---

### Task 1: Backend — bills proxy, icon storage, template `bill_id`

**Files:**
- Create: `back/app/Http/Controllers/SubscriptionController.php`, `back/app/Models/Subscription.php`, `back/database/migrations/2026_11_26_000000_create_subscriptions_table.php`, `back/database/migrations/2026_11_26_100000_add_bill_to_templates.php`
- Modify: `back/routes/api.php`, `back/app/Models/TransactionTemplate.php`

**Interfaces:**
- Produces: `GET|POST /api/bills`, `GET|PUT|DELETE /api/bills/{id}` proxied to Firefly `/api/v1/bills...` (query string forwarded), with Pico `icon` merged in; `transaction_templates.bill_id` (nullable int) round-trips.

- [ ] **Step 1:** `SubscriptionController extends BaseControllerFirefly`, constructor only: `parent::__construct('/api/v1/bills', Subscription::class)` (copy `PiggyBankController`).
- [ ] **Step 2:** `Subscription extends BaseModel` with `$fillable = ['id', 'icon']`, `$extraFields = ['icon']`, `$with = []` (copy `PiggyBank`). Migration creates `subscriptions` (`id`, timestamps, `icon` string 1000 nullable) — copy `create_recurrences_table`.
- [ ] **Step 3:** `RouteUtils::makeCRUD('bills', SubscriptionController::class);` under the other Firefly proxied resources, plus its `use`.
- [ ] **Step 4:** Migration adding nullable integer `bill_id` to `transaction_templates` (copy `add_budget_to_templates`); add `'bill_id'` to `TransactionTemplate::$fillable`.
- [ ] **Step 5: Verify.** From `back/`: `php artisan route:list --path=bills` → 5 routes on `SubscriptionController`; `php artisan migrate` → both migrations run; `php artisan test` → passes.
- [ ] **Step 6: Commit** `feat(back): proxy Firefly bills as subscriptions, bill_id on templates`.

---

### Task 2: Pure subscription logic

**Files:**
- Create: `front/core/utils/SubscriptionUtils.js` (imports only `lodash-es` and `date-fns` — no `~/` aliases, so `node` can import it)

**Interfaces:**
- Produces:
  - `subscriptionRepeatFreq` = `{ weekly: { code: 'weekly', perMonth: 52 / 12 }, monthly: { code: 'monthly', perMonth: 1 }, quarterly: { code: 'quarterly', perMonth: 1 / 3 }, halfYear: { code: 'half-year', perMonth: 1 / 6 }, yearly: { code: 'yearly', perMonth: 1 / 12 } }`
  - `subscriptionState = { paid: 'paid', due: 'due', missed: 'missed' }`
  - `getAverageAmount(subscription) -> number` — (`amount_min` + `amount_max`) / 2, parsed floats, missing → 0
  - `getMonthlyCost(subscription) -> number` — average × `perMonth` of `attributes.repeat_freq` ÷ (`skip` + 1)
  - `getMonthStatus(subscription, today: Date) -> null | { state, expected, paid, nextDate: Date|null, isOffSchedule }` — reads `attributes.pay_dates: Date[]`, `attributes.paid_dates: { date: Date }[]`, `attributes.next_expected_match: Date|null`; rules exactly as the spec's "Dashboard card" section (null when both arrays are empty; `passed` = pay dates with `startOfDay(date) <= startOfDay(today)`; `nextDate` = first pay date after the first `paid` ones when due/missed, `next_expected_match` when off-schedule)
  - `getReminders(list, today: Date, days = 30) -> { subscription, kind: 'end'|'extension', date: Date }[]` — active subscriptions whose `end_date` / `extension_date` is within `[today, today + days]`, sorted by date

- [ ] **Step 1: Write the checks** (scratch file outside the repo, not committed) as `subscription-utils-check.mjs` importing `front/core/utils/SubscriptionUtils.js` by absolute path, with `node:assert`:
  - monthly 10/10 skip 0 → `getMonthlyCost` 10; yearly 120/120 → 10; weekly 12/12 → 52; monthly 8/12 skip 1 → 5 (Review Focus 4)
  - weekly, `pay_dates` [1st, 8th, 15th, 22nd], `paid_dates` [1st, 8th], today 16th → `{ state: 'missed', expected: 4, paid: 2, isOffSchedule: false }` (Review Focus 2)
  - same with today 10th → `due`, `nextDate` = 15th
  - monthly, `pay_dates` [3rd], `paid_dates` [3rd] → `paid`
  - quarterly, `pay_dates` [], `paid_dates` [5th], `next_expected_match` next month → `{ state: 'paid', expected: 0, paid: 1, isOffSchedule: true }` (Review Focus 3)
  - both empty → `null`
  - `getReminders`: `extension_date` in 10 days → one `extension` entry; `end_date` in 40 days → none; inactive → none
- [ ] **Step 2:** `cd front && node <scratchpad>/subscription-utils-check.mjs` → fails (module missing).
- [ ] **Step 3:** Implement `SubscriptionUtils.js` to the interfaces above.
- [ ] **Step 4:** Re-run → all assertions pass, no output.
- [ ] **Step 5: Commit** `feat(core): subscription cost and month-status helpers`.

---

### Task 3: Core entity, settings toggle, sync, demo data

**Files:**
- Create: `front/core/models/Subscription.js`, `front/core/repository/SubscriptionRepository.js`, `front/core/transformers/SubscriptionTransformer.js`, `front/core/stores/subscriptionStore.js`, `front/core/composables/useSubscriptionForm.js`, `front/core/composables/useSubscriptionTotals.js`
- Modify: `front/core/stores/profileStore.js` (toggle + `budgetsEnabled` default), `front/core/stores/appStore.js` (sync), `front/core/stores/dashboardStore.js` (`fetchDashboard` also fetches subscriptions), `front/core/constants/TablerIconConstants.js` (`subscription: 'IconReceiptRefund'`), `front/core/constants/RouteConstants.js` (`ROUTE_SUBSCRIPTION_LIST: '/subscriptions/list'`, `ROUTE_SUBSCRIPTION_ID: '/subscriptions'`), `front/core/demo/DemoSeed.js`, i18n (all 12)

**Interfaces:**
- Consumes: Task 2 helpers.
- Produces:
  - `Subscription` model: `getEmpty()` per spec (`repeat_freq: 'monthly'`, `skip: 0`, `active: true`, `date: new Date()`), statics `getDisplayName`, `getIcon` (inherited if BaseModel has it), `getCurrencySymbol`, `getCurrencyCode`, `isActive`, `getRepeatFreqList()` → `[{ code, t: 'subscription_page.repeat.<code>' }]`, re-exporting `getAverageAmount`, `getMonthlyCost`, `getMonthStatus` from Task 2 as statics.
  - `SubscriptionRepository` → `super('api/bills')`.
  - `SubscriptionTransformer.transformFromApi`: `date`, `end_date`, `extension_date`, `next_expected_match` → Date via `DateUtils.autoToDate`; `pay_dates` → `Date[]`; `paid_dates` → same objects with `date` as Date; `currency` from `currencyDictionary[currency_id]`. `transformToApi`: `name, icon, amount_min, amount_max, date, end_date, extension_date (DateUtils.dateToString, null when empty), repeat_freq, skip, active, notes, currency_id`.
  - `useSubscriptionStore()`: `subscriptionList` (useLocalStorage `'subscriptionList'`), `isLoadingSubscriptions`, `subscriptionDictionary`, `fetchSubscriptions()` — `[]` when `!profileStore.subscriptionsEnabled`, else `getAllWithMerge({ filters: [{ field: 'start', value: <startOfMonth today> }, { field: 'end', value: <endOfMonth today> }] })`.
  - `useSubscriptionForm(options)` on `useEntityForm` (copy `usePiggyBankForm` without the money panel) returning form + fields `name, icon, amountMin, amountMax, currency, date, repeatFreq, skip, endDate, extensionDate, active, notes`.
  - `useSubscriptionTotals()` → `{ monthly: ComputedRef<number>, yearly: ComputedRef<number>, currencySymbol: ComputedRef<string> }` over active subscriptions, each converted from its currency code into `dashboardStore.dashboardCurrencyCode`.
  - `profileStore.subscriptionsEnabled` (`useLocalStorage('subscriptionsEnabled', false)`), exported.

- [ ] **Step 1:** Implement the files above to their interfaces; add the toggle next to `piggyBanksEnabled` and flip `budgetsEnabled` default to `false`; add `subscriptionStore.fetchSubscriptions()` to `appStore`'s sync list and `dashboardStore.fetchDashboard()` next to `fetchPiggyBanks()`.
- [ ] **Step 2:** Demo seed: add a `bills` list to `createDemoSeed()` with three entries whose `pay_dates`/`paid_dates` are computed relative to `today` (format `yyyy-MM-dd`): Netflix monthly 15.99 paid this month; Gym weekly 12 with the current month's weekly dates and only the first one paid; Car insurance yearly 480 with `pay_dates: []` and `extension_date` in 20 days. (Demo GET ignores `start`/`end`; static dates are fine.)
- [ ] **Step 3:** i18n keys (all 12): `subscription`, `subscriptions`, `subscription_select`, `subscription_page.title_add`, `subscription_page.title_edit`, `subscription_page.amount_min`, `subscription_page.amount_max`, `subscription_page.first_date`, `subscription_page.repeat_freq`, `subscription_page.skip`, `subscription_page.skip_description`, `subscription_page.end_date`, `subscription_page.extension_date`, `subscription_page.active`, `subscription_page.repeat.{weekly,monthly,quarterly,half-year,yearly}`, `subscription_page.per_month`, `subscription_page.per_year`, `subscription_page.state.{paid,due,missed,not_due}`, `settings.setup.enable_subscriptions`.
- [ ] **Step 4: Verify.** `npm run lint` clean; start demo in the browser, enable nothing yet → `localStorage.subscriptionList` is `[]`; set `localStorage.subscriptionsEnabled = 'true'`, reload, sync → `subscriptionList` holds 3 items with Date-parsed `pay_dates`. In a fresh profile (clear localStorage) `budgetsEnabled` reads `false`, `piggyBanksEnabled` `false`, `subscriptionsEnabled` `false`, others `true`.
- [ ] **Step 5: Commit** `feat(core): subscription entity, store, settings toggle`.

---

### Task 4: Mobile and desktop CRUD screens + entry points

**Files:**
- Create: `front/mobile/pages/subscriptions/list.vue`, `front/mobile/pages/subscriptions/[[id]].vue`, `front/mobile/components/list-items/subscription-list-item.vue`, `front/mobile/components/select/subscription-repeat-select.vue`, `front/desktop/pages/subscriptions.vue`, `front/desktop/components/dialogs/subscription-dialog.vue`
- Modify: `front/mobile/pages/extras.vue`, `front/mobile/pages/settings/enabled-resources.vue`, `front/mobile/pages/settings/setup.vue`, `front/desktop/routes.js` (`{ path: '/subscriptions/:id?', component: () => import('./pages/subscriptions.vue') }`), `front/desktop/composables/useDesktopNav.js`, `front/desktop/composables/useCommandPalette.js`, `front/desktop/components/settings/settings-connection.vue`, i18n

**Interfaces:**
- Consumes: Task 3 (`useSubscriptionForm`, `useSubscriptionStore`, `useSubscriptionTotals`, `Subscription.getMonthStatus`, routes, toggle).

- [ ] **Step 1: Mobile** — copy `mobile/pages/piggy-banks/` structure. Form fields in this order inside `app-card`s: name (required), icon, amount min + amount max (required, max ≥ min via a rule), currency, first expected date (required), repeat frequency (required, `subscription-repeat-select` over `Subscription.getRepeatFreqList()`), skip (number, description `subscription_page.skip_description`), end date, extension date, active (`app-boolean`), notes; delete button last. List page: an `app-card` header with `useSubscriptionTotals` (`€142 / month · €1,704 / year`), then rows: icon, name, subtitle "<frequency> · next <date>", right side average amount + a `.mx-chip` with the `getMonthStatus(item, new Date())` state (or `not_due` when null). Inactive rows dimmed. Entry in `extras.vue` gated by `subscriptionsEnabled`. Toggle added to `enabled-resources.vue` (draft ref + `useSettingsDraft` entry like piggy banks) and `setup.vue`.
- [ ] **Step 2: Desktop** — copy `desktop/pages/piggy-banks.vue` + `piggy-bank-dialog.vue`; page description shows the totals; list rows as on mobile with a status pill; dialog has the same fields as `d-field`s. Nav item (`IconReceiptRefund`, hidden when off), command palette entry, `settings-connection.vue` toggle entry `{ path: 'subscriptionsEnabled', t: 'settings.setup.enable_subscriptions' }`.
- [ ] **Step 3: Verify** in demo mode, both apps, light + dark: toggle on in Enabled resources → entry appears in extras / sidebar; list shows 3 seeded subscriptions and totals (`15.99 + 52 + 40 = 107.99 / month`, `1295.88 / year`); create, edit, delete (undo toast) work; validation blocks max < min; toggle off → entry points disappear. `npm run lint` clean.
- [ ] **Step 4: Commit** `feat: subscriptions screens on mobile and desktop`.

---

### Task 5: Link transactions to subscriptions

**Files:**
- Create: `front/mobile/components/select/subscription-select.vue`, `front/desktop/components/select/subscription-select.vue` (copy the piggy-bank selects; list = active subscriptions)
- Modify: `front/core/transformers/TransactionTransformer.js`, `front/core/constants/TransactionConstants.js` (`transactionFormField.subscription` after `budget`: `{ t: 'subscription', code: 'subscription', icon: TablerIconConstants.subscription, isVisible: true }`), `front/core/composables/useTransactionForm.js`, `front/mobile/components/transaction/TransactionForm.vue`, `front/desktop/components/transactions/transaction-fields.vue`, plus `split-view` files if they list budget per split (`desktop/components/transactions/split-view.vue`, `mobile/components/transaction/transaction-split-view.vue`)

**Interfaces:**
- Consumes: `subscriptionDictionary`, `Subscription.getAverageAmount`.
- Produces: split field `transaction.subscription` (subscription object or null); `useTransactionForm` returns `subscription`.

- [ ] **Step 1: Transformer.** `transformFromApi`: `transaction.subscription = subscriptionDictionary[transaction.bill_id]` (the raw `bill_id` stays on the split). `transformToApi`, only when `profileStore.subscriptionsEnabled`: `bill_id` = the selected subscription's id; else, if the split has a raw `bill_id` that isn't in `subscriptionDictionary` (unknown to this device), send that raw `bill_id` back unchanged; else the unlink value. Determine the unlink value against a live Firefly (`null` vs `0`) — if none is available, use `null` and list it as unverified in the hand-off.
- [ ] **Step 2: Form.** Add `subscription` to `generateChildren` in `useTransactionForm`; watch it: when it becomes non-null and `amount` is empty or 0, set `amount` to `Subscription.getAverageAmount(value)` (formatted like other amount sets in that file). When the type changes away from withdrawal, clear it. Templates carry `subscription` over in `onTransactionTemplateSelected` (Task 6 supplies `transactionTemplate.subscription`).
- [ ] **Step 3: UI.** Mobile: `<subscription-select v-if="profileStore.subscriptionsEnabled && isWithdrawal" v-model="subscription" :style="getStyleForField(transactionFormField.subscription)" />` after `budget-select`. Desktop: matching `d-field` after the budget field with `isFieldVisible(transactionFormField.subscription)`. Check that the existing form-field migration adds the new entry for users with a stored field list (the builder check found `migrateTypeList` does this — confirm).
- [ ] **Step 4: Verify** in demo, both apps: new withdrawal → pick Netflix → amount fills `15.99`; with an amount typed first it doesn't change; deposit hides the field; save → demo DB split has `bill_id`; reopen → Netflix selected; with `subscriptionsEnabled` off, editing that transaction and saving leaves `bill_id` in the demo DB untouched (Review Focus 1); delete the subscription from the store list only (`subscriptionList` without Netflix), edit + save → `bill_id` still sent unchanged.
- [ ] **Step 5: Commit** `feat: link transactions to subscriptions`.

---

### Task 6: Subscriptions on recurring transactions and templates

**Files:**
- Modify: `front/core/models/RecurringTransaction.js` (`getEmpty` gets `subscription: null`), `front/core/transformers/RecurringTransactionTransformer.js`, `front/core/composables/useRecurringTransactionForm.js`, `front/mobile/pages/recurring-transactions/[[id]].vue`, `front/desktop/components/dialogs/recurring-dialog.vue`, `front/core/transformers/TransactionTemplateTransformer.js`, `front/core/composables/useTemplateForm.js`, `front/mobile/pages/transaction-templates/[[id]].vue`, `front/desktop/components/dialogs/template-dialog.vue`

**Interfaces:**
- Consumes: Task 5 selects, `subscriptionDictionary`.
- Produces: `recurring.attributes.subscription`, `template.subscription`.

- [ ] **Step 1:** Recurring transformer: read `attributes.subscription = subscriptionDictionary[transaction.bill_id]`; write `transaction.bill_id = subscriptionId ?? null` under `if ((subscriptionId || isUpdate) && profileStore.subscriptionsEnabled)` — mirror `budget_id`. Add the field to the form composable and both UIs (shown for withdrawals only, gated by the toggle).
- [ ] **Step 2:** Template transformer: read `item.subscription = subscriptionDictionary[item.bill_id]`; write `bill_id: get(item, 'subscription.id') ?? null` only when the toggle is on. Add `'subscription'` to `useTemplateForm`'s `generateChildren` list and to the "create template from transaction" mapping there (next to `budget: transaction.budget`). Add to both template UIs.
- [ ] **Step 3: Verify** in demo: recurring Rent → set a subscription → save → demo `recurrences[...].attributes.transactions[0].bill_id` set; reopen shows it. Template Coffee → set Netflix → save; new transaction from that template → subscription preselected (amount stays the template's). `npm run lint` clean.
- [ ] **Step 4: Commit** `feat: subscriptions on recurring transactions and templates`.

---

### Task 7: Transaction filter and "payment history" drill-down

**Files:**
- Modify: `front/core/utils/TransactionFilterUtils.js`, `front/mobile/components/transaction/transaction-filters-content.vue`, `front/desktop/components/transactions/transaction-filters.vue`, `front/desktop/components/ui/filter-chips.vue` (if it lists filter keys), `front/mobile/pages/subscriptions/[[id]].vue`, `front/desktop/components/dialogs/subscription-dialog.vue`, i18n

**Interfaces:**
- Produces: `TransactionFilterUtils.filters.subscription` = `{ bagKey: 'subscription', filter: (item) => \`bill_is:"${Subscription.getDisplayName(item)}"\`, display: (item) => \`Subscription: ${...}\`, toUrl: (item) => \`bill_id=${item.id}\`, fromUrl: () => useSubscriptionStore().subscriptionDictionary[useRoute().query?.bill_id] }`; `filters.noSubscription` = `has_any_bill:false`, `without_bill=true`, bagKey `withoutSubscription`. URL `ROUTE_TRANSACTION_LIST?bill_id=<id>` opens the list filtered.

- [ ] **Step 1:** Add both filters next to `budget` / `noBudget`; add the pickers to both filter UIs exactly where budget's are, gated by the toggle.
- [ ] **Step 2:** "Payments" button (`subscription_page.payments`) on the mobile form (edit mode only, in the toolbar `#right` or a card action) and the desktop dialog's `d-info` quick links, navigating with `navigateTo({ path: RouteConstants.ROUTE_TRANSACTION_LIST, query: { bill_id: itemId } })` — match how category/tag drill-downs build their URL.
- [ ] **Step 3: Verify** in demo: tapping Payments on Netflix opens the transaction list with a "Subscription: Netflix" chip and `bill_id` in the URL (demo search ignores the operator — check the request's `query` contains `bill_is:"Netflix"` via `read_network_requests` or the demo adapter); the filter sheet can set/clear it in both apps. Against a live Firefly if available: the list is actually filtered, and "No subscription" returns only unlinked ones.
- [ ] **Step 4: Commit** `feat: filter transactions by subscription`.

---

### Task 8: Dashboard card

**Files:**
- Create: `front/mobile/components/dashboard/dashboard-subscriptions/dashboard-subscriptions.vue`, `front/desktop/components/dashboard/dash-subscriptions.vue`
- Modify: `front/core/constants/DashboardConstants.js` (`subscriptions: { t: 'settings.dashboard.cards.subscriptions', code: 'subscriptions', isVisible: true }`), `front/core/stores/dashboardStore.js`, `front/core/composables/useDashboardControls.js`, `front/core/composables/useDashboard.js`, `front/mobile/pages/dashboard.vue`, `front/desktop/pages/dashboard.vue`, `front/mobile/pages/settings/dashboard/cards.vue`, i18n

**Interfaces:**
- Consumes: Task 2 `getMonthStatus`, `getReminders`, `getAverageAmount`; `convertCurrency`; `SubscriptionTransformer`.
- Produces:
  - `dashboardStore.dashboardSubscriptionList` (`ref([])`), `isLoadingDashboardSubscriptions`, `fetchSubscriptionsForInterval()` — skipped (list `[]`) when the toggle is off; requests `start = dashboardDateStart`, `end = dashboardDateEnd`; ignores a response if a newer request started meanwhile (incrementing counter) (Review Focus 5). Called from `fetchDashboard()` and wherever `useDashboardControls` calls `fetchTransactionsForInterval()` on month change.
  - `useDashboard().subscriptionsMonth` → `{ rows: [{ subscription, label, icon, state, expected, paid, isOffSchedule, nextDate, dateFormatted, amount }], paidCount, expectedCount, paidAmount, expectedAmount, currencySymbol, reminders: [{ subscription, label, kind, date, dateFormatted }] }`. Today for status = `min(new Date(), dashboardDateEnd)` so past months evaluate as fully passed. Rows sorted missed → due (by `nextDate`) → paid. Amounts: paid = sum of `paid_dates[].amount` when Firefly provides it, else `getAverageAmount × paid`; expected = `getAverageAmount × expected`; all converted to `dashboardCurrencyCode`. Reminders from the synced `subscriptionStore` list with `new Date()`.

- [ ] **Step 1:** Implement store + composable to the interfaces; register the card in both dashboard pages' card maps, `useDashboard`'s visibility map (`profileStore.subscriptionsEnabled`) and `cards.vue`'s gate.
- [ ] **Step 2:** Mobile card (copy `dashboard-piggy-banks` structure): header "Paid X of Y" + `paidAmount / expectedAmount`, rows (icon, name, `paid/expected` when expected > 1, date or "paid early/late", amount, state chip in `--t-inc` for paid / `--destructive` for missed / muted for due), reminders block ("<name> — cancel by <date>" for extension, "ends <date>" for end). Rows open `ROUTE_TRANSACTION_LIST?bill_id=<id>`. Desktop card same content in `d-card` (copy `dash-piggy-banks.vue`). i18n: `settings.dashboard.cards.subscriptions`, `dashboard.subscriptions.paid_of`, `dashboard.subscriptions.paid_off_schedule`, `dashboard.subscriptions.cancel_by`, `dashboard.subscriptions.ends_on`, `dashboard.subscriptions.empty`.
- [ ] **Step 3: Verify** in demo, both apps, both themes: card shows Paid 1 of 2 (Netflix paid; Gym missed or due depending on today's date vs the first weekly date — check against `getMonthStatus`), Car insurance reminder "cancel by <today+20>"; switching month refetches (one `bills?start=…&end=…` request per change in network log) and rapid switching ends on the last month; card hidden when the toggle is off and absent from the card settings list.
- [ ] **Step 4: Commit** `feat: subscriptions dashboard card`.

---

### Task 9: Whole-feature verification

- [ ] **Step 1:** From `front/`: `npm run lint` and `npm run build` succeed; locale JSON parse one-liner succeeds.
- [ ] **Step 2:** From `back/`: `php artisan test` passes.
- [ ] **Step 3:** Demo walk-through in both apps × both themes covering Tasks 4–8; screenshot the list page and dashboard card for the hand-off.
- [ ] **Step 4:** Live Firefly (if the user provides one): unlink value for `bill_id`, `bill_is` / `has_any_bill` operators, `pay_dates`/`paid_dates` populated for a past month, `paid_dates[].amount` presence. Report each as verified or not verified.
