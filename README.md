# grants-ui-grasslands-tests

Playwright journey test suite for the Grasslands grant.

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

There are three Playwright configuration files for different environments:

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

### CI Pipeline — playwright.ci.config.js

```bash
npm run test:ci
```

- Runs against the URL specified by the `BASE_URL` env var
- Used in the `grants-ui` GitHub Actions CI pipeline
- Automated execution on creating and updating a `grants-ui` PR
- No report generated, console logging only

## Test Coverage

| Spec | Description |
|---|---|
| `smoke.spec.js` | Navigates to the grasslands start page and confirms it loads. |

## Project Structure

```
grants-ui-grasslands-tests/
├── test/
│   └── specs/
├── playwright.cdp.config.js    # CDP Portal config
├── playwright.local.config.js  # Local development config
└── playwright.ci.config.js     # CI pipeline config
```

## Test Reports

The native Playwright HTML report is used. When running on CDP, the report is automatically published to S3 and made available in the portal.

## Troubleshooting

### Tests Won't Run

- Ensure you have the correct Node.js version: `node --version` should be `>=24.15.0 <25.0.0`
- Ensure the service under test is running and accessible at the configured base URL
- Run `npx playwright install chromium` if the browser is not installed

## Related Repositories

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
