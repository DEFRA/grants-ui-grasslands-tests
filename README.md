# grants-ui-grasslands-tests

Runner for the Grasslands grant journey tests on the CDP Portal and against a local grants-ui.

The tests themselves live in [grants-config-grasslands](https://github.com/DEFRA/grants-config-grasslands) under `test/grants-ui`, alongside the journey config they exercise. This repo holds no specs: on every run it fetches the config repo at its latest release tag into `.grasslands-config/` (gitignored) and runs the tests from there. This is the same tag grants-ui's CI uses. Set `GRASSLANDS_TAG` to pin a release, e.g. `GRASSLANDS_TAG=0.24.2 npm run test:local`.

## What This Tests

This test suite provides journey testing coverage for:

- Grasslands grant application journeys served by [grants-ui](https://github.com/DEFRA/grants-ui)

## Technology Stack

- **Playwright** - Browser automation framework
- **Node.js 24+** - Runtime environment

## Prerequisites

- Node.js `>=24.15.0 <25.0.0` (check with `node --version`)
- npm (comes with Node.js)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/DEFRA/grants-ui-grasslands-tests.git
cd grants-ui-grasslands-tests
npm install
npx playwright install chromium
```

### 2. Run Tests

```bash
npm run test:local
```

Default environment variables for local runs are set in `playwright.local.config.js`. Override any of them by creating a `.env` file in the project root.

## Running the Test Suite

There are two Playwright configuration files for different environments:

### Local Development — playwright.local.config.js

```bash
npm run test:local
```

- Runs against `http://localhost:3000`
- Headed browser (visible)
- Report opens automatically on failure

### CDP Portal — playwright.cdp.config.js

```bash
npm test
```

- Runs against the CDP environment specified by the `ENVIRONMENT` env var
- Base URL pattern: `https://grants-ui.${ENVIRONMENT}.cdp-int.defra.cloud`
- Triggered via the CDP Portal under Test Suites
- Publishes an HTML report to S3
- Runs in Microsoft Edge (Playwright's `msedge` channel). The CDP Portal runner is Linux, so this is the Linux build of Edge rather than true Windows Edge — best endeavours coverage, not a substitute for testing on Windows Edge directly

## Project Structure

```
grants-ui-grasslands-tests/
├── scripts/fetch-tests.sh      # Fetches the tests from grants-config-grasslands
├── playwright.cdp.config.js    # CDP Portal config
└── playwright.local.config.js  # Local development config
```

## Test Reports

The native Playwright HTML report is used. When running on CDP, the report is automatically published to S3 and made available in the portal.

## Troubleshooting

### Tests Won't Run

- Ensure you have the correct Node.js version: `node --version` should be `>=24.15.0 <25.0.0`
- Ensure the service under test is running and accessible at the configured base URL
- Run `npx playwright install chromium` if the browser is not installed

## Related Repositories

- [grants-config-grasslands](https://github.com/DEFRA/grants-config-grasslands) - Grasslands config and the journey tests themselves
- [grants-ui](https://github.com/DEFRA/grants-ui) - The main grants application UI service

## Support

For questions or issues with this test suite, please contact the Grants Application Enablement (GAE) team.

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
