# Repository Guidelines

CDP Portal (and local) runner for the Grasslands grant journey tests. **This repo contains no specs.** The Playwright tests live in `grants-config-grasslands` under `test/grants-ui/`, next to the journey config they exercise, because the two change in lockstep. grants-ui's CI pipeline builds and runs them straight from that repo (`grants-ui/compose.tests.yml`, `tools/docker-compose-smoke-test.sh`); this repo does the same for CDP and local runs.

## How the tests are fetched

`scripts/fetch-tests.sh` runs first in both `npm test` and `npm run test:local`. (`.npmrc` sets `ignore-scripts=true`, so npm `pre*` hooks won't run; keep the fetch chained into each script.) It:

1. Resolves the latest `grants-config-grasslands` tag from `https://api.github.com/repos/DEFRA/grants-config-grasslands/tags` (`.[0].name`), the same lookup grants-ui uses. Set `GRASSLANDS_TAG` to pin a release instead.
2. Downloads the source tarball at that tag and extracts it into `.grasslands-config/` (gitignored and dockerignored), replacing any previous copy.

On CDP, GitHub is only reachable via the egress proxy. The script passes `CDP_HTTPS_PROXY` (falling back to `CDP_HTTP_PROXY`) to its own `curl` calls only, without exporting `HTTP(S)_PROXY`, so the browser's route to grants-ui is unchanged. Without the proxy the tags lookup returns nothing and Playwright never runs, which shows up as `/app/playwright-report is not found` at the publish step.

Both Playwright configs set `testDir` to `./.grasslands-config/test/grants-ui/test/specs`. The spec reads the GAS schema by relative path (`configurations/grasslands/gas/gas.json` in the same tarball), so the whole repo is extracted rather than just `test/grants-ui`.

The fetched code has no `node_modules` of its own. Its imports (`@playwright/test`, `@axe-core/playwright`, `ajv`, `mockserver-client`) resolve up to **this** repo's `node_modules`. Keep `package.json` dependencies in line with `grants-config-grasslands/test/grants-ui/package.json`, and keep `@playwright/test` in line with the `mcr.microsoft.com/playwright` tag in the `Dockerfile`. Don't install deps inside `.grasslands-config`: a second copy of `@playwright/test` breaks the runner.

To change a test, change it in `grants-config-grasslands` and cut a release. This repo picks it up on its next run without being rebuilt.

```
scripts/fetch-tests.sh        # fetches grants-config-grasslands at the latest tag
playwright.cdp.config.js      # CDP Portal config
playwright.local.config.js    # local config, against localhost:3000
bin/publish-tests.sh          # publishes the HTML report to S3 (CDP only)
.grasslands-config/           # fetched at run time, not committed
```

## Tech Stack

- **Test framework**: Playwright (`@playwright/test`), JavaScript only, no TypeScript
- **Node version**: 24.15.0 (see `.nvmrc`)

## Commands

| Script | What it does |
|---|---|
| `npm test` | Fetch tests, run in CDP mode (requires `ENVIRONMENT` env var) |
| `npm run test:local` | Fetch tests, run against local grants-ui at `http://localhost:3000` (headed) |
| `npm run report:publish` | Push `playwright-report/` to S3 via `RESULTS_OUTPUT_S3_PATH` |

CDP base URL: `https://grants-ui.${ENVIRONMENT}.cdp-int.defra.cloud`. Local env defaults (`MOCKSERVER_HOST`, `MOCKSERVER_PORT`, `GRANTS_UI_BACKEND_AUTH_TOKEN`, `GRANTS_UI_BACKEND_ENCRYPTION_KEY`, `BASE_BACKEND_URL`) are set in `playwright.local.config.js` and can be overridden with a `.env` file.

This repo is **not** part of the grants-ui CI pipeline, so there is no CI config.

## Domain Language

Use `CONTEXT.md` as the source of truth for grasslands grant journey-test language.

## Developer Addenda

Developers can add their own `AGENTS.local.md`, which should be read as an addendum to this file. Keep it local to your machine and don't commit it.

## Entrypoint behaviour

`entrypoint.sh` follows the standard CDP test-suite pattern: it always runs `npm test` (no command is passed in), then publishes the report.

- If tests fail, a `FAILED` file is written and the process exits with code 1
- Report publishing via `npm run report:publish` always runs, and `RESULTS_OUTPUT_S3_PATH` must be set. The image is only for CDP. For local runs use `npm run test:local` outside Docker

## Docker

The `Dockerfile` installs the AWS CLI and Playwright's Microsoft Edge (`msedge`) with system dependencies via the `mcr.microsoft.com/playwright` base image. Build for linux/amd64 on M1 Macs:

```sh
docker build . --platform=linux/amd64
```

## GitHub Actions

- `.github/workflows/check-pull-request.yml` — installs dependencies on PRs
- `.github/workflows/publish.yml` — builds and publishes the Docker image on merge to main

## Spec-authoring notes (to move to grants-config-grasslands)

These notes cover writing the specs, which now live in `grants-config-grasslands/test/grants-ui`. They are kept here until that repo's AGENTS.md takes them over.

#### Accessibility checks

Call `analyzeAccessibility(page)` (from `test/utils/accessibility.js`, following the woodland suite's pattern in `grants-ui-woodland-tests`) the first time the journey visits each distinct page. Do not repeat the check if the spec revisits the same page later (e.g. navigating back to `/tasks` after completing a task) — one check per page is enough.

#### Grasslands journey shape (differs from woodland)

The grasslands journey config (`grants-config-grasslands/configurations/grasslands/grants-ui/grasslands.yaml`) is map-based, not a linear sequence of yes/no eligibility pages like woodland's. Key differences to keep in mind when adding pages to the spec:

- `/select-land-parcel` (`MapSelectPageController`) renders an interactive Leaflet map, not a static list. There is no clickable-in-Playwright canvas selector — drive it by dispatching a synthetic DOM event instead, e.g. `page.evaluate(() => document.getElementById('parcel-map').dispatchEvent(new CustomEvent('parcel-map:selection', { bubbles: true, detail: { selectedIds: ['<sheetId>-<parcelId>'] } })))`. This pattern is proven in `grants-ui/acceptance/test/steps/when.steps.js`.
- `singleParcelSubmission: true` forces single-select mode regardless of any per-page config.
- `/select-actions-for-land-parcel` (`SelectActionsPageController`) is a normal server-rendered checkbox list of the grant's `enabledLandActions` (`CLIG3`, `CSAM3`, `SCR2`). `CSAM3` requires a quantity input alongside its checkbox. Checking a box fires an async `POST /api/land-grants/actions/<parcelId>` to refresh availability for every other action — see `test/utils/accessibility.js`-adjacent comment in the spec itself for how the wait is done (a per-checkbox "Updating…" banner, not `page.waitForResponse`, which did not observe this fetch call reliably in local runs).
- `/you-must-have-consent` (`ConsentPageController`) only renders if the selected actions require consent; otherwise the controller auto-proceeds and the page is skipped.
- `/declaration` (`DeclarationPageController`)'s submit button reads **"I agree - submit my application"**, not the yaml's `options.submitButtonText` ("Save and continue") or `config.submitButtonText` ("Confirm and submit") used elsewhere — it has its own fixed label, confirmed from a live run rather than the yaml.
- Land parcel data comes from two separate upstreams: `grants-ui-dal-stub` answers "what parcels does this SBI own" (via Consolidated View GraphQL stub), and `land-grants-api` answers "what size is this parcel and which actions is it eligible for". Both need to be running/seeded for the journey past `/select-land-parcel` to work.

#### Task list section-boundary behaviour

Submitting a page redirects straight to the *next page in the same task-list section* — but submitting the **last** page of a section redirects back to `/tasks` instead of chaining into the next section, even though the next section's first page would otherwise be the obvious next step. This tripped up the spec twice while it was being built (`management-control-of-land` → tasks, not → `select-land-parcel`; `select-actions-for-land-parcel` → tasks, not → `summary`). When adding a new page immediately after one that completes a section (see `sections:` in `grasslands.yaml` for boundaries), assert on `/tasks` with `assertTaskStatuses(...)` and click the next task's link, rather than assuming the engine chains straight through.

#### Authentication

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

