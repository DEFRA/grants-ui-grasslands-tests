# grants-ui-grasslands-tests

CDP and local runner for the Grasslands grant journey tests, which live in `grants-config-grasslands`.

## Language

**Grasslands grant**
The Grasslands grant journey under test.
_Avoid_: Woodland grant, Grassland (singular)

**Journey test**
An end-to-end browser test that exercises the grant application flow.
_Avoid_: Unit test, Smoke test, Performance test

**GAS**
The Grants Application Service used for submission and lifecycle state.
_Avoid_: Grants UI Backend, Config API, Playwright helper

**Defra ID**
The OIDC identity provider used to authenticate test users.
_Avoid_: Test login, Local account, Browser session

**CRN**
Customer Reference Number: the Defra ID identifier for an individual user.
_Avoid_: SBI, User ID, Account number

**SBI**
Single Business Identifier: the Rural Payments identifier for a business/organisation, distinct from the personal CRN.
_Avoid_: CRN, User ID, Organisation ID

**Land parcel**
A single mapped area of land, identified by a sheet ID and parcel ID (e.g. `SD8545-7357`), selected on the map-based `/select-land-parcel` page.
_Avoid_: Field, Plot, Land parcels (when a single parcel is meant, since `singleParcelSubmission` limits grasslands to one)

**Land action**
An SFI action code (e.g. `CLIG3`, `CSAM3`, `SCR2`) selected for a land parcel on `/select-actions-for-land-parcel`.
_Avoid_: Option, Grant type, Scheme

**Task list**
The `/tasks` page listing the grant journey's sections (Check before you start, Select land and actions, Review and submit) and their per-page completion status.
_Avoid_: Dashboard, Menu, Home page

**GAS schema**
The GAS JSON schema at `configurations/grasslands/gas/gas.json` in `grants-config-grasslands`, fetched with the journey tests and used to validate a submitted application's `answers` payload shape.
_Avoid_: GAS response, Submission payload (when the schema file itself is meant)

**Config release**
A tagged release of `grants-config-grasslands` (e.g. `0.24.2`). The journey tests and the journey config ship together in it, and each run fetches the latest one unless `GRASSLANDS_TAG` pins one.
_Avoid_: Test version, Test image tag, grants-ui version
