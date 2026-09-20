# Firefly Pico developer documentation

A standalone Docus site. The existing `docs/` folder is unchanged.

The original chapter structure and page routes come from the sibling `firefly-pico-docs` project. All page prose is rewritten for developers; Introduction gains a concepts overview and Guide adds a progressive explanation of the implementation.

With a current Node.js LTS supported by Nuxt, run from this directory:

```sh
npm install
npm run dev
```

Use `npm run build` for a production server build or `npm run generate` for static output in `.output/public`. For subdirectory hosting, set `NUXT_APP_BASE_URL` to the deployment path before generating.

Edit Markdown under `content/`. Numeric prefixes control sidebar ordering; `.navigation.yml` files name the chapters. Diagrams are accessible SVG files in `public/images/` and can be edited without an image service. Docus supplies navigation, search, typography, and the mobile layout.

The guide describes this app checkout, rather than promising compatibility with every release. Review the relevant source when changing application behavior.
