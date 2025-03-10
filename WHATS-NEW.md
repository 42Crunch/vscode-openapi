# What's New

Version 4.32 of the OpenAPI Editor includes the following changes. Changes are for all users (Free and paid) unless specified.

- Adds support for OpenAPI 3.1 (beta)
- Allow exporting Scan and Audit reports
- Update SwaggerUI dependency to support OpenAPI 3.0.4 in preview

Access the [full changelog](https://github.com/42Crunch/vscode-openapi/blob/master/CHANGELOG.md) of the OpenAPI editor

# Major updates with Version 4.x.x

We have added API security services to the OpenAPI Editor. These services enable you do much more than simply create and edit your OpenAPI definition, they allow you to test your APIs locally for quality, conformance and security directly in the IDE.

- Local version of [API Audit](https://42crunch.com/api-security-audit/), A static analysis of your OpenAPI definition file that checks for quality, conformance (to the OpenAPI specification) and security as you work on it.
- Local version of [API Scan](https://42crunch.com/api-conformance-scan/). A dynamic analysis of your API that tests your API for conformance to the API Design and for security vulnerabilities including tests for BOLA and BFLA.
- Try it: Allows you to send HTTP requests directly from the editor to test the functionality of the API endpoints.

[Registration](command:openapi.platform.openSignUp) is required (email address only) to enable the API security testing services of API Audit and API Scan. You receive a free monthly usage allowance with the option to upgrade to a paid subscription if you require extra usage.

Freemium includes:

- Free monthly allowance of 100 operation-level audits and 100 operation-level scans.
- Allowances are calculated at the operation level. You can run full audits and full scans, but the number of operations included in the API will be counted and deducted from your monthly allowance.
- You can track your allowance and usage in the plugin settings/connection section.
- You can upgrade to a single user license if you want to increase your monthly allowances of API Audit and API Scan. [Prices](https://42crunch.com/single-user-pricing/) start from $15 a month.
- Learn more about the [freemium](https://42crunch.com/freemium/).
