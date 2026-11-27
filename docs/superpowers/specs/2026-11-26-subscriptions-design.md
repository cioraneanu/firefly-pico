# Subscriptions (Firefly III bills) in Pico — design

## Intent

Pico users should manage Firefly III subscriptions (API name: `bills`) without opening Firefly: create and edit them, link payments to them while entering transactions, and see on the dashboard what is paid, due, missed and coming up. Firefly stays the source of truth for schedules and paid status; Pico is a thin, fast UI over it, like every other entity.

## Goals

1. Full CRUD of subscriptions in both apps (mobile `mx` kit, desktop `d-*` kit).
2. Link a transaction to a subscription from the transaction form (both apps).
3. Link recurring transactions and transaction templates to a subscription, so the transactions they produce are linked automatically.
4. Transaction list filter "Subscription is …" (and "No subscription"), driven by URL like categories/tags/budgets.
5. "Payment history" = navigating from a subscription to the transaction list with that filter pre-applied (no history list inside the subscription screen).
6. Cost totals: monthly and yearly cost of all active subscriptions.
7. Dashboard card: paid / due / missed for the dashboard's selected month, plus contract reminders.
8. Amount pre-fill: choosing a subscription on a transaction whose amount is empty fills the subscription's expected amount.
9. A Subscriptions switch in "Enabled resources" (both apps), and new-user defaults: all resources on except budgets, piggy banks and subscriptions.

## Non-goals

- Creating or editing Firefly rules from Pico.
- Showing expected subscription dates on the desktop calendar card.
- The assistant (ramble) choosing a subscription.
- An in-screen payment-history list (goal 5 replaces it).
- Pico computing schedules itself.

## Anti-goals (would be a failure even if it "works")

- Pico silently removing a subscription link that Firefly (or a Firefly rule) set — e.g. editing a transaction in Pico with the feature off must not unlink it.
- Paid/unpaid status in Pico disagreeing with Firefly's own subscriptions page.
- Imperative CRUD code off the house pattern (`useEntityForm`, `useList`, `generateChildren`, stores).

## Approaches considered (paid/due status source)

- **A. Firefly computes status; dashboard card follows the selected month — chosen.** `GET /bills?start=&end=` returns `pay_dates`, `paid_dates` and `next_expected_match` for the range. The store syncs with the current month; the dashboard card refetches for the selected month. Matches how category/tag cards follow the month; always agrees with Firefly. Costs one request per month change.
- **B. Firefly computes status once at sync; card always shows "now".** Simpler and offline-friendly, but you can't look back at what was missed in a past month. Rejected by the user in favour of A.
- **C. Pico computes the schedule** from `date`/`repeat_freq`/`skip` and checks linked transactions. Rejected: duplicates Firefly's date rules (skip, end/extension dates) and creates two sources of truth.

## Decisions

### Naming and feature switch
- Called **Subscriptions** everywhere in the UI and in front-end code (`Subscription` model, `subscriptionStore`, `useSubscriptionForm`, routes `/subscriptions/...`). The backend route and Firefly endpoint stay `bills`.
- New profile toggle `subscriptionsEnabled` (`useLocalStorage`, **default `false`**, like `piggyBanksEnabled`), listed wherever `piggyBanksEnabled` is: the **"Enabled resources"** settings in both apps (mobile `settings/enabled-resources.vue`, desktop `settings-connection.vue` toggle list), mobile `settings/setup.vue`, extras page, `useDesktopNav`, `useCommandPalette`, dashboard card visibility (`useDashboard.js`). Store fetch returns `[]` when off.
- **Defaults for new users** (no key in localStorage yet): every resource ON except budgets, piggy banks and subscriptions. The only default that changes is `budgetsEnabled` (`true` → `false`) in `profileStore.js`, the single place these defaults live. Existing users keep their choice: `useLocalStorage` writes the default to storage on first read, so everyone who has opened Pico already has the key stored.

### Backend (`back/`)
- `SubscriptionController extends BaseControllerFirefly` with `parent::__construct('/api/v1/bills', Subscription::class)` — whole class.
- Route `RouteUtils::makeCRUD('bills', SubscriptionController::class)`. **The Pico route must be named `bills`**: `getFullUrl()` forwards the request path after `/api/` to Firefly `/api/v1/…`, so the path is what reaches Firefly. Query params (`start`, `end`, `page`) pass through the same way.
- `Subscription` model extending `BaseModel` with `$extraFields = ['icon']`, plus new migration `create_subscriptions_table` (`id`, timestamps, `icon` string 1000 nullable) — same as `recurrences` / `piggy_banks`.
- New migration adding nullable integer `bill_id` to `transaction_templates`; add `bill_id` to `TransactionTemplate::$fillable` and to whatever template validation/repository code handles `budget_id`.

### Front-end core
- **Model `Subscription`** (`getEmpty`: `name`, `icon`, `amount_min`, `amount_max`, `date` (today), `repeat_freq: 'monthly'`, `skip: 0`, `end_date`, `extension_date`, `active: true`, `notes`, `currency`). Static helpers: `getDisplayName`, `getAverageAmount` ((min+max)/2), `getMonthlyCost` (average × factor ÷ (skip+1); factors weekly 52/12, monthly 1, quarterly 1/3, half-year 1/6, yearly 1/12), `getCurrencySymbol`, `isActive`, `getNextExpectedDate`, `getPayDates`, `getPaidDates`, a `repeatFreqList` enum with i18n keys.
- **Repository** `SubscriptionRepository extends BaseRepository` (endpoint `bills`); **transformer** `SubscriptionTransformer` (dates via `DateUtils`, currency from `currencyDictionary`, icon passthrough); `transformToApi` sends `currency_id`.
- **Store** `subscriptionStore`: `subscriptionList` (`useLocalStorage`), `isLoadingSubscriptions`, `subscriptionDictionary`, `fetchSubscriptions()` calling `getAllWithMerge` with `start`/`end` = current month. Added to `appStore` sync alongside `fetchPiggyBanks()`.
- **Form composable** `useSubscriptionForm` on `useEntityForm` + `generateChildren` (copy `usePiggyBankForm`'s shape, minus the money panel). Validation: name required, amount_min/max required, max ≥ min, date and repeat frequency required.
- **Cost totals** computed in core (e.g. in the subscription list composable/model): monthly and yearly total of active subscriptions, **converted into `dashboardStore.dashboardCurrency`** with `convertCurrency()` from `core/utils/CurrencyUtils.js` — the same way every other dashboard card converts (rates + the user's exchange-rate overrides). One number each, shown with that currency's symbol. The dashboard card's paid/expected amounts convert the same way. *(Builder-check correction; my call, to match the other cards.)*

### Linking
- **Transaction**: `TransactionTransformer.transformFromApi` maps `transaction.subscription = subscriptionDictionary[bill_id]`; `transformToApi` sends `bill_id` **only when `profileStore.subscriptionsEnabled`** (so the feature off never touches existing links). With the feature on, clearing the field sends the value Firefly accepts to unlink (verify `null` vs `0` against the API during implementation, the way budget uses `0`).
- New `transactionFormField.subscription` entry so the field takes part in the existing per-field visibility/ordering; select shown only when `subscriptionsEnabled` and the transaction is a withdrawal (subscriptions are withdrawals only). Mobile: `subscription-select` next to `budget-select` in `TransactionForm.vue`; desktop: `d-subscription-select` in `transaction-fields.vue`. Both live in `useTransactionForm` / `useTransactionEditor` (core), never only one UI.
- **Amount pre-fill** (core): when the subscription changes to a non-empty value and the amount is empty/zero, set amount to `Subscription.getAverageAmount`.
- **Recurring transactions**: `RecurringTransactionTransformer` reads/sends `bill_id` with the same `if (id || isUpdate)` pattern as `budget_id`; field added to `useRecurringTransactionForm` and both recurring UIs.
- **Templates**: `TransactionTemplateTransformer` reads `bill_id` → `subscription`, sends `bill_id`; field added to `useTemplateForm` and both template UIs; applying a template to a new transaction carries the subscription over (wherever budget is carried over today).

### Filtering and "payment history"
- `TransactionFilterUtils.filters.subscription`: `filter: bill_is:"<name>"`, `toUrl: bill_id=<id>`, `fromUrl` via `subscriptionDictionary`; `noSubscription`: `has_any_bill:false`, `without_bill=true`. Wire into the filter UIs wherever `budget`/`noBudget` appear (mobile filter sheet, desktop `d-sheet` filters), gated by `subscriptionsEnabled`.
- "Payment history": a button on the subscription form (mobile) / dialog (desktop) and a tap target on dashboard rows navigates to `ROUTE_TRANSACTION_LIST` with `bill_id=<id>`, exactly like the existing category/tag drill-downs.

### Screens
- **Mobile**: `mobile/pages/subscriptions/list.vue` and `[[id]].vue` per the page recipe (copy `piggy-banks/`). List header card shows the cost totals; each row: icon, name, frequency + next expected date subtitle, average amount, a status chip for the current month (Paid / Due <date> / Missed / Not due). Entry in `extras.vue`.
- **Desktop**: `desktop/pages/subscriptions.vue` (route `/subscriptions/:id?`) + `desktop/components/dialogs/subscription-dialog.vue` per the desktop recipe (copy piggy banks); totals in the page header/description area; nav entry in `useDesktopNav`, command palette entry.
- Routes `ROUTE_SUBSCRIPTION_LIST` / `ROUTE_SUBSCRIPTION_ID` in `RouteConstants.js` and `desktop/routes.js`.
- Form fields: name, icon, amount min, amount max, currency, first expected date, repeat frequency, skip ("every N periods"), end date, extension date, active, notes.

### Dashboard card (approach A)
- `dashboardCard.subscriptions` in `DashboardConstants.js`; visibility gated by `subscriptionsEnabled` in `useDashboard.js`.
- `dashboardStore` gets `fetchSubscriptionsForInterval()` that calls `/bills?start=&end=` for the selected month (same month boundaries the other month cards use), triggered from the same place `fetchTransactionsForInterval()` is, and only when the card is enabled. Result kept in a `ref` (not persisted).
- Card content (core computed in `useDashboard.js`, rendered by `mobile/components/dashboard/dashboard-subscriptions/` and `desktop/components/dashboard/dash-subscriptions.vue`):
  - **One row per subscription** (decided by the user). A subscription appears if it has at least one `pay_dates` entry or at least one `paid_dates` entry in the month. Any payment in the range counts — no matching of payments to specific expected dates (same as Firefly's own page).
  - Per row: `expected = pay_dates.length`, `paid = paid_dates.length`, `passed = pay_dates` on or before today.
    - **Missed** if `paid < passed`; else **Due** if `paid < expected` (show "paid/expected" when expected > 1, plus the next unpaid date); else **Paid**.
    - `expected = 0` but `paid > 0` (paid early/late): row shows **Paid** with a "paid early/late" hint (next expected date from `next_expected_match`).
  - Header: "Paid X of Y" where Y = subscriptions with `expected > 0`, X = those of them in Paid state. Amounts: paid = sum of the linked payment amounts if available in the response, else `average × paid` (builder's call after checking what `paid_dates` carries); expected = `average × expected` over rows with `expected > 0`. Off-schedule payments add to "paid" but not to Y or "expected". All amounts converted into `dashboardCurrency`.
  - Rows sorted Missed → Due (by next date) → Paid. Tapping a row opens the transaction list filtered by that subscription.
  - Reminders: active subscriptions whose `end_date` or `extension_date` falls within the next 30 days ("Gym — cancel by Dec 3"), based on the synced store, independent of the selected month.

### i18n
- All labels in all 12 locale files (`subscriptions`, `subscription_page.*`, repeat frequencies, status words, totals, reminder text, settings toggle, dashboard card name, filter labels).

## Left to the builder

- Exact visual layout of rows/cards within the existing kits, following the AGENTS.md design language; check light and dark in both apps.
- Precise placement of the subscription field in the transaction form's default order.
- How the mobile filter sheet presents the two new filters, mirroring budget.
- Verify against a live Firefly: unlink value for `bill_id`; `has_any_bill` / `bill_is` search operators; that `pay_dates`/`paid_dates` are populated for the requested range.
