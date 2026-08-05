# Repository Guidelines

Playwright journey test suite for the Grasslands grant service, designed to run on the Defra CDP platform and in the `grants-ui` CI pipeline.

## Project Structure & Module Organization

Playwright specs live in `test/specs/`, shared helpers in `test/utils/`. Environment-specific execution is configured by `playwright.local.config.js`, `playwright.cdp.config.js`, and `playwright.ci.config.js`. Report publishing is handled by `bin/publish-tests.sh`. The GAS schema used for submission assertions is fetched on demand by `scripts/fetch-schema.sh` into `test/schemas/` (gitignored, not committed).

```
test/
  utils/
    auth.js              # authenticateTo() helper — handles OIDC flow
    backend.js            # clearApplicationData() — wipes app state via grants-ui-backend admin API
    backend-auth.js        # encrypted bearer token for the backend admin API
    accessibility.js        # analyzeAccessibility() — axe-core WCAG check
    gas.js                  # MockServer wrapper for GAS interactions (CI only)
  specs/
    application-journey.spec.js    # Full Grasslands journey, page by page
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

### Expect timeouts differ per environment

Each config sets its own `expect.timeout`, longer the further from a local machine: `playwright.local.config.js` (10s), `playwright.ci.config.js` (20s), `playwright.cdp.config.js` (30s). This mirrors the local/CI split already used by `grants-ui/acceptance` (`test/support/world.js` — 25s local vs 55s CI/CDP): local runs should fail fast for a tight feedback loop, while CI/CDP need more headroom for real network latency, a real Defra ID provider (CDP Test), and slower round trips to `land-grants-api`/the DAL stub. Don't let this drift back to Playwright's unconfigured 5s default in any config — that's too short for anything hitting a real backend.

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

Run the relevant Playwright config locally or in CI mode before opening a PR.

### Accessibility checks

Call `analyzeAccessibility(page)` (from `test/utils/accessibility.js`, following the woodland suite's pattern in `grants-ui-woodland-tests`) the first time the journey visits each distinct page. Do not repeat the check if the spec revisits the same page later (e.g. navigating back to `/tasks` after completing a task) — one check per page is enough.

### GAS (Grant Application Service)

`grants-ui` submits applications to an external service called GAS. In CI, GAS is replaced by a **MockServer** instance, which is why `application-journey.spec.js`'s "verify GAS submission" step is gated behind `CI()` (checks `process.env.MOCKSERVER_HOST`) and only runs there. `scripts/fetch-schema.sh` pulls the current GAS JSON schema from `grants-config-grasslands` (`configurations/grasslands/fg-gas-backend/grasslands.json`) into `test/schemas/gas.schema.json` for submission-shape assertions.

The `test/utils/gas.js` helper wraps `mockserver-client` and provides `getApplicationSubmission(referenceNumber)` to retrieve the recorded POST request from MockServer.

**Env vars used locally:** `MOCKSERVER_HOST`, `MOCKSERVER_PORT`, `GRANTS_UI_BACKEND_AUTH_TOKEN`, `GRANTS_UI_BACKEND_ENCRYPTION_KEY`, `BASE_BACKEND_URL`. Defaults are set in `playwright.local.config.js`.

### Grasslands journey shape (differs from woodland)

The grasslands journey config (`grants-config-grasslands/configurations/grasslands/grants-ui/grasslands.yaml`) is map-based, not a linear sequence of yes/no eligibility pages like woodland's. Key differences to keep in mind when adding pages to the spec:

- `/select-land-parcel` (`MapSelectPageController`) renders an interactive Leaflet map, not a static list. There is no clickable-in-Playwright canvas selector — drive it by dispatching a synthetic DOM event instead, e.g. `page.evaluate(() => document.getElementById('parcel-map').dispatchEvent(new CustomEvent('parcel-map:selection', { bubbles: true, detail: { selectedIds: ['<sheetId>-<parcelId>'] } })))`. This pattern is proven in `grants-ui/acceptance/test/steps/when.steps.js`.
- `singleParcelSubmission: true` forces single-select mode regardless of any per-page config.
- `/select-actions-for-land-parcel` (`SelectActionsPageController`) is a normal server-rendered checkbox list of the grant's `enabledLandActions` (`CLIG3`, `CSAM3`, `SCR2`). `CSAM3` requires a quantity input alongside its checkbox. Checking a box fires an async `POST /api/land-grants/actions/<parcelId>` to refresh availability for every other action — see `test/utils/accessibility.js`-adjacent comment in the spec itself for how the wait is done (a per-checkbox "Updating…" banner, not `page.waitForResponse`, which did not observe this fetch call reliably in local runs).
- `/you-must-have-consent` (`ConsentPageController`) only renders if the selected actions require consent; otherwise the controller auto-proceeds and the page is skipped.
- `/declaration` (`DeclarationPageController`)'s submit button reads **"I agree - submit my application"**, not the yaml's `options.submitButtonText` ("Save and continue") or `config.submitButtonText` ("Confirm and submit") used elsewhere — it has its own fixed label, confirmed from a live run rather than the yaml.
- Land parcel data comes from two separate upstreams: `grants-ui-dal-stub` answers "what parcels does this SBI own" (via Consolidated View GraphQL stub), and `land-grants-api` answers "what size is this parcel and which actions is it eligible for". Both need to be running/seeded for the journey past `/select-land-parcel` to work.

### Task list section-boundary behaviour

Submitting a page redirects straight to the *next page in the same task-list section* — but submitting the **last** page of a section redirects back to `/tasks` instead of chaining into the next section, even though the next section's first page would otherwise be the obvious next step. This tripped up the spec twice while it was being built (`management-control-of-land` → tasks, not → `select-land-parcel`; `select-actions-for-land-parcel` → tasks, not → `summary`). When adding a new page immediately after one that completes a section (see `sections:` in `grasslands.yaml` for boundaries), assert on `/tasks` with `assertTaskStatuses(...)` and click the next task's link, rather than assuming the engine chains straight through.

### Authentication

Journey tests that require sign-in should authenticate via the `Defra ID` OIDC provider used by `grants-ui`. In local running, CI, and the CDP Dev environment this is a stub (`fct-defra-id-stub`). In the CDP Test environment this is a real instance of Defra ID, which can be slower to respond and must be catered for. Follow the `login()` helper pattern in `grants-ui-woodland-tests/test/utils/auth.js` when adding authenticated journeys:

1. Navigate to a protected URL → app redirects to stub login page
2. Fill in CRN + password and submit
3. Stub redirects back via OIDC to `/auth/sign-in-oidc`

Each spec must supply its own CRN so tests can run in parallel without sharing session state.
**Password:** hardcoded as `x` (the stub always accepts this password)

**Test user:** CRN `1103171356` / SBI `107214733` ("Giles Edwin Vardey" / "Kirsten Shenton"), sourced from `grants-ui/fcp-defra-id-stub/users.json` and `grants-ui-dal-stub/fixtures/land-data/107214733.json`. Chosen because:
- it is not already used by `grants-ui/acceptance` feature tests, `grants-ui-woodland-tests`, or `land-grants-journey-tests` (all checked at the time of writing — re-check before reusing a CRN for a second test user, to keep parallel runs isolated)
- its land parcels (e.g. sheet `SD8545` parcel `7357`) have land cover class codes (130/131) in `land-grants-api`'s seed data (`src/land-data/land_covers/covers.csv`) that are eligible for all three of grasslands' `enabledLandActions` (`CLIG3`, `CSAM3`, `SCR2`), per `src/land-data/land_cover_codes/land_cover_codes_actions.csv`

If a second test user is ever needed (e.g. for parallel specs), cross-check candidate CRNs against those same three repos first.

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
