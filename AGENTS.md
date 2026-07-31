# Repository Guidelines

Playwright journey test suite for the Grasslands grant service, designed to run on the Defra CDP platform and in the `grants-ui` CI pipeline.

## Project Structure & Module Organization

Playwright specs live in `test/specs/`. Environment-specific execution is configured by `playwright.local.config.js`, `playwright.cdp.config.js`, and `playwright.ci.config.js`. Report publishing is handled by `bin/publish-tests.sh`. The GAS schema used for submission assertions is fetched on demand by `scripts/fetch-schema.sh` into `test/schemas/` (gitignored, not committed).

```
test/
  specs/
    smoke.spec.js    # Confirms the grasslands start page is reachable
```

## Tech Stack

- **Test framework**: Playwright (`@playwright/test`) — JavaScript only, no TypeScript
- **Node version**: 24.15.0 (see `.nvmrc`)

## Build, Test, and Development Commands

- `npm install`: install dependencies.
- `npx playwright install chromium`: install the browser for local runs.
- `npm run test:local`: run against local Grants UI.
- `npm test`: run the CDP Portal configuration.
- `npm run test:ci`: run the CI configuration.
- `npm run report:publish`: publish the Playwright HTML report.

### Local — `npm run test:local`

Runs against a local instance of `grants-ui` at `http://localhost:3000`. Uses a headed browser. Fetches the GAS schema via `scripts/fetch-schema.sh` before running. Config: `playwright.local.config.js`.

### grants-ui CI pipeline — `npm run test:ci`

Runs inside the `grants-ui` GitHub Actions CI pipeline against a dockerised instance of the system under test. The base URL is provided via the `BASE_URL` env var. Worker count is controlled via `MAX_INSTANCES` (default 1). Config: `playwright.ci.config.js`.

### CDP — `npm test`

Runs against a CDP-deployed instance of `grants-ui`. The base URL is built from the `ENVIRONMENT` env var:

```
https://grants-ui.${ENVIRONMENT}.cdp-int.defra.cloud
```

Triggered via the CDP Portal. The HTML report is published to S3 after the run. Config: `playwright.cdp.config.js`.

## npm scripts

| Script | What it does |
|---|---|
| `npm test` | CDP mode (requires `ENVIRONMENT` env var) |
| `npm run test:local` | Local mode against localhost:3000 |
| `npm run test:ci` | CI pipeline mode (requires `BASE_URL` env var) |
| `npm run report:publish` | Push `playwright-report/` to S3 via `RESULTS_OUTPUT_S3_PATH` |

## Coding Style & Naming Conventions

Use ES modules and the local Playwright style. Keep specs named after the journey or behaviour they cover.

- **JavaScript only** — no TypeScript. Defra policy.
- **No assertions in page objects** — if page objects are introduced, they encapsulate navigation and interaction only. Assertions belong in the spec.
- **Helper functions at the bottom of the file** — any file-scoped helper functions must be declared after the `test.describe` block, not before.

## Domain Language

Use `CONTEXT.md` as the source of truth for grasslands grant journey-test language. Prefer those terms in specs, helpers, docs, and generated changes.

## Developer Addenda

Developers can add their own `AGENTS.local.md` and should be read as an addendum to this file. Keep that file local to your machine and do not commit it.

## Testing Guidelines

Run the relevant Playwright config locally or in CI mode before opening a PR. As journey coverage grows beyond the current smoke test, preserve accessibility checks (`@axe-core/playwright`) on any new journey pages, following the woodland suite's pattern in `grants-ui-woodland-tests`.

### GAS (Grant Application Service)

`grants-ui` submits applications to an external service called GAS. In CI, GAS is replaced by a **MockServer** instance. `scripts/fetch-schema.sh` pulls the current GAS JSON schema from `grants-config-grasslands` (`configurations/grasslands/fg-gas-backend/grasslands.json`) into `test/schemas/gas.schema.json` for use in submission-shape assertions once journey specs are added.

**Env vars used locally:** `MOCKSERVER_HOST`, `MOCKSERVER_PORT`, `GRANTS_UI_BACKEND_AUTH_TOKEN`, `GRANTS_UI_BACKEND_ENCRYPTION_KEY`, `BASE_BACKEND_URL`. Defaults are set in `playwright.local.config.js`.

### Authentication

Journey tests that require sign-in should authenticate via the `Defra ID` OIDC provider used by `grants-ui`. In local running, CI, and the CDP Dev environment this is a stub (`fct-defra-id-stub`). In the CDP Test environment this is a real instance of Defra ID, which can be slower to respond and must be catered for. Follow the `login()` helper pattern in `grants-ui-woodland-tests/test/utils/auth.js` when adding authenticated journeys:

1. Navigate to a protected URL → app redirects to stub login page
2. Fill in CRN + password and submit
3. Stub redirects back via OIDC to `/auth/sign-in-oidc`

Each spec must supply its own CRN so tests can run in parallel without sharing session state.
**Password:** hardcoded as `x` (the stub always accepts this password)

## Entrypoint behaviour

`entrypoint.sh` accepts the command as arguments (`"$@"`), defaulting to `npm test` via the Dockerfile `CMD`. This allows the `grants-ui` CI pipeline to override it with `npm run test:ci`.

- If tests fail, a `FAILED` file is written and the process exits with code 1
- Report publishing via `npm run report:publish` only runs when `CDP_HTTP_PROXY` is set (i.e. on CDP, not in CI)
- `RESULTS_OUTPUT_S3_PATH` must be set when running on CDP

## Docker

The `Dockerfile` installs the AWS CLI and Playwright's Chromium with system dependencies via the `mcr.microsoft.com/playwright` base image. Build for linux/amd64 on M1 Macs:

```sh
docker build . --platform=linux/amd64
```

## CI pipeline integration

This suite is intended for integration into the `grants-ui` CI pipeline. Key points:

- `ignoreHTTPSErrors: true` is set in `playwright.ci.config.js` — the CI environment uses a self-signed cert that Playwright cannot resolve via `NODE_EXTRA_CA_CERTS` (Playwright uses its own certificate store)
- `MAX_INSTANCES` env var controls worker count (default 1)
- No report is generated or published in CI mode — console output only (`list` reporter)

## GitHub Actions

- `.github/workflows/check-pull-request.yml` — installs dependencies on PRs
- `.github/workflows/publish.yml` — builds and publishes the Docker image on merge to main
