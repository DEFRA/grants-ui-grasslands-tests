# grants-ui-grasslands-tests

Playwright journey tests for the Grasslands grant application.

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
