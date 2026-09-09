# Contributing to Firefly Pico

Thanks for taking the time to contribute! 🎉

TLDR: 
- All PRs must target the `dev` branch
- PRs and Issues described with AI will be ignored and closed. I am manually reading all your requests, please keep the communication human to human
and manually write it as well.
- Unnecessary long vibe-coded PRs will be rejected. Keep things small and reuse what we already have. Don't just throw +3000 lines of code 
for a basic feature.

---

## Branching model

The repository uses a two-branch flow:

| Branch | Purpose | Docker tag |
| --- | --- | --- |
| `dev` | Integration branch. **All work lands here first.** | `cioraneanu/firefly-pico:dev` |
| `main` | Released, stable code. Fast-forwarded from `dev` by the maintainer. | `cioraneanu/firefly-pico:latest` |

```
feature/my-thing ──PR──▶ dev ──fast-forward──▶ main ──tag──▶ Docker Hub
```

### The rule

> **`main` is only ever updated by a fast-forward merge from `dev`.**
> Everything else — features, fixes, docs, translations — targets `dev` via a pull request.

If you open a pull request against `main`, the **`.github/workflows/pr-base-branch.yml`** check fails
with a red X telling you to retarget it. GitHub cannot stop such a PR from being *opened*; just edit it
and change the base branch to `dev` — no need to close and re-open.

### Working on a change

- Branch names: `feature/…`, `fix/…`, `docs/…`, `chore/…`. Including the issue number helps
  (`feature/321-virtual-balance-display`).
- Keep pull requests focused. One concern per PR is much easier to review than a mixed bag.
- Rebase or merge `dev` into your branch to resolve conflicts before asking for review.


## Reporting issues

Before opening an issue, please check whether the behaviour comes from Firefly III itself — Pico proxies
a lot of endpoints straight through. Useful details to include:

- Firefly Pico version (visible in the app's Settings) and Firefly III version
- How you run it (Docker image, which compose file, reverse proxy?)
- Browser / device, and whether it's the mobile or desktop layout
- Steps to reproduce, plus any browser console or container log output

Please redact your Firefly III URL, API tokens and any real financial data from screenshots and logs.

---

## Coding conventions

The short version; [`AGENTS.md`](AGENTS.md) has the full list and the reasoning behind each rule.

- **Plain JavaScript**, no TypeScript syntax, despite `tsconfig.json` existing.
- **Prettier is the source of truth** (`front/.prettierrc`): single quotes, no semicolons, trailing
  commas, 2-space indent, `printWidth: 200`.
- Vue: `<script setup>` only (no Options API), `defineModel()` for v-model, no `<style scoped>` — styles
  go into `front/assets/styles/theme-white.css` with a matching `.van-theme-dark` override.
- Reuse the existing building blocks: `useForm()` / `useList()` composables, `front/repository`,
  `front/models`, `front/transformers`, `front/stores`, and the `components/ui-kit` primitives.
  A new CRUD screen should be mostly declarative glue.
- Entity data is JSON:API shaped — read it with `get(item, 'attributes.name')`, never `item.name`.
- Use `lodash-es` (not `lodash`) and `date-fns` (not `moment`/`dayjs`).
- Laravel: controllers use `getOne` / `getAll` / `create` / `update` / `delete`; validation lives in
  static classes under `app/Validations/`; use the global `fget()` / `fset()` / `fcollect()` helpers.
  Never edit an existing migration — add a new one.
- Don't add npm or Composer dependencies without discussing it first.

### Translations

Every user-visible string is translated. Adding a key means adding it to **all 10 locale files** in
`front/i18n/locales/`: `en`, `ro`, `zh-CN`, `it`, `pt-BR`, `de-DE`, `fr`, `pl`, `ru-RU`, `es-MX`.
Keys use underscores between words and dots for nesting (`category_page.title_edit`).

If you can't translate a language, copy the English string so the key exists and say so in the PR —
a native speaker can refine it later.

---

## Before you open a pull request
- Check the change in **both** the mobile and desktop layouts (the switch is
  `appStore.isDesktopLayout`, width > 800px on a desktop device — not a CSS media query).
- Check **both** light and dark themes.
- Never commit secrets, real Firefly tokens, personal `.env` values, or real financial data.
- Screenshots or a short screen recording are very welcome for UI changes.