# Deployment guide

How to run BetterInfanta locally and deploy it to Cloudflare Pages.

## 1. Prerequisites

- **Node.js 20 or later.** The project targets Node 20. Earlier versions may work but are not tested.
- **npm** (bundled with Node). A `.npmrc` is included.
- **Git.**
- **A Cloudflare account** for deployment. Local development does not require one.

## 2. Local development

`git clone https://github.com/davisolpruvnik/better-infanta.git`
`cd better-infanta`
`npm install`
`npm run convert-yaml`
`npm run dev`

The dev server runs at `http://localhost:5173`.

The `convert-yaml` step generates JSON from the YAML sources under `content/` and `src/data/`. Run it once after cloning, and again after editing any YAML file. `npm run dev:yaml` combines the conversion and the dev server into one command.

There are no environment variables to set. Configuration lives in the YAML and TypeScript files under `content/` and `src/data/`.

## 3. Build and preview

`npm run build`
`npm run preview`


The build output goes to `dist/`. The preview server serves `dist/` at `http://localhost:4173`.

The build does not suppress TypeScript errors. Fix the type, do not disable the check.

## 4. Deploy to Cloudflare Pages

### Connect a repository

1. Push the repo to GitHub, GitLab, or Bitbucket.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository.
4. Configure the build:
   - **Framework preset:** None (or Vite, if offered)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** set `NODE_VERSION` to `20` under Environment variables, or add a `.nvmrc` file with `20`.
5. Save and deploy.

### Direct upload (alternative)

If you do not want to connect a repository:

`npm run build`
`npx wrangler pages deploy dist --project-name=betterinfanta`
* *The project name can be anything like `better[your municipality]-[optionally, your province]`; e.g. betterinfanta-quezon, or betterquezon-quezon*


The `wrangler` CLI requires a Cloudflare API token. This path is for one-off deploys, not for continuous deployment.

### Subsequent deploys

Every push to the production branch triggers a production deploy. Every PR triggers a preview deploy.

## 5. SPA routing

BetterInfanta uses React Router, which is a client-side router. Cloudflare Pages serves static files. A direct request to a route like `/services/health-services` will 404 unless a fallback rule sends it to `index.html`.

The fallback is a `_redirects` file in `public/`:

`/* /index.html 200`


This file must exist in `public/` and must be present in the build output. If it is missing, deep links will break in production while continuing to work in local development — a specific and common failure.

The tree includes `public/_headers` but the presence of `public/_redirects` should be verified before deploying. If it is missing, add it.

## 6. Headers

`public/_headers` controls caching and security headers on the deployed site. Cloudflare Pages reads this file at deploy time.

Edit it if you need to change CSP or cache behavior. The file syntax is Cloudflare's, not Vercel's.

## 7. Domain configuration

The project's domain is `betterinfantaquezon.org`.

**Why include "quezon"?** There are multiple places named Infanta in the Philippines, such as Infanta in Pangasinan, and more internationally. Including the province disambiguates.

Your town may not have similar cases so you have the choice to drop the province part, or include it anyway, nothing wrong with both of them.

### Setup

1. In Cloudflare Pages, go to **Custom domains** and add a domain of your choice.
2. If the domain is registered through Cloudflare, DNS is configured automatically.
3. If the domain is registered elsewhere, point the registrar's nameservers to Cloudflare and manage DNS from the Cloudflare dashboard. Add:
   - Apex: `A` or `AAAA` record provided by Cloudflare
   - `www`: `CNAME` to your Pages project
4. Cloudflare provisions TLS automatically.

## 9. Common deployment issues

**Deep links return 404 in production.** The `_redirects` file is missing or not in `public/`. See section 5.

**Build fails on a content file.** The YAML is malformed. Run `npm run build` locally to see the exact error. YAML is whitespace-sensitive; a missing indent will fail the parse.

**Build fails on a TypeScript error.** The project does not suppress type errors. Read the error, fix the type.

**YAML content is not appearing.** Run `npm run convert-yaml`. The JSON has not been generated.

**Tide or weather data is missing in production.** The Open-Meteo API may be rate-limiting or down. The portal degrades — the section shows an error state rather than breaking the page.

**Build succeeds locally but fails on Cloudflare Pages.** Check the Node version. Cloudflare Pages defaults to an older Node than the project targets. Set `NODE_VERSION` to `20` in the build environment variables.

**Pre-commit hook is failing.** Husky runs lint and format on staged files. Fix the lint error rather than bypassing with `--no-verify`.

**Domain is not resolving.** DNS propagation can take up to 48 hours, though it is usually faster. Check with `dig` before assuming a problem.

## See also

- [README.md](./README.md) — project overview
- [CONTENT-MANAGEMENT.md](./CONTENT-MANAGEMENT.md) — content workflow
- [DESIGN.md](./DESIGN.md) — the design system
