# Changelog

## Version 4.31.0 (December 23, 2024)

- Implement support for SQGs in Audit when using CLI binary
- Add ability to select CLI binary as a runtime for Audit for enterprise customers
- Support tagging of local OpenAPI files with platform tags
- Allow removing Scenarios in Scan config UI

## Version 4.30.1 (December 3, 2024)

- Increase stdout buffer size when running the Scan using the CLI binary

## Version 4.30.0 (November 20, 2024)

- Added ability to tag local API files or link them to the platform APIs
- Updated Scan configuration web UI to allow specifying reportMaxSize option
- Added extra check for the CLI binary updates when testes in the Config web UI
- Added workaround for ENOMEM exceptions when invoking the platform APIs
- Fix issue with example background colors in SwaggerUI preview #295

## Version 4.29.2 (October 7, 2024)

- Remove whitespace characters during the freemium signup flow

## Version 4.29.0 (October 1, 2024)

- Show subscription status in the Config webapp
- Add Scan button to the toolbar
- Do not automatically re-try failing HTTP request sent from Scan / Try it UIs

## Version 4.28.0 (August 13, 2024)

- New UI for logins and signups for 42Crunch platform
- Do not rely on platform API calls when creating Scan configuration for enterprise customers, if CLI runtime is choosen
- Do not display warnings when displaying high priority semantic/structural issues in the Audit
- Better handling of http proxies when CLI binary is used
- Allow specifying location for the CLI binary
- Fix issue in the Scan when using response processing with 'default' responses

## Version 4.27.0 (June 27, 2024)

- Make API Security Testing Binary required to run Audits
- Add ability to extract variables in Scan by clicking on the response body values
- Add 'Context' tab to the Scan UI to show information about variables used by Operation

## Version 4.26.3 (June 5, 2024)

- Fix issue with text editor contents jerking on code lenses being added/removed during editing #275 

## Version 4.26.2 (May 31, 2024)

- Add support for floating windows in extension webviews
- Change default runtime for Scan to API Security Testing Binary

## Version 4.26.0 (May 22, 2024)

- Allow all users to run 42Crunch Scan
- Show 42Crunch icon in the status bar to authenticated users
- Add command "Open Scan configuration file for the current OpenAPI file" to display relevant Scan config
- Add Audit/Scan code lenses to the top of the OpenAPI file
- Allow switching between different authentication types (Security Audit Token/IDE Token) if both are available
- Allow running full Scans (in addition to per-operation Scans)

## Version 4.25.3 (April 23, 2024)

- Fix resource leak issue reported in #266

## Version 4.25.2 (April 18, 2024)

- Add setting to disable contribution of OpenAPI schemas for YAML files #269 
- Allow configuring auth info for external references #256

## Version 4.25.1 (March 1, 2024)

- Downgrade swagger-ui dependency in preview to fix #264
- Display 'security' property in the operation nodes in OpenAPI Explorer

## Version 4.25.0 (February 29, 2024)

- Make scand-manager timeout configurable

## Version 4.24.1 (February 23, 2024)

- Fix issue where authorization tests dialog would not show in Scan UI

## Version 4.24.0 (February 19, 2024)

- Updated to the lastest SwaggerUI version for OpenAPI preview
- Support form/urlencoded bodies in external requests in Scan UI
- Support raw bodies in Scan UI

## Version 4.23.0 (February 15, 2024)

- Display 'requestBody' in the operation node OpenAPI Explorer
- Display operation child nodes in OperationID / Tag nodes in OpenAPI Explorer
- Fix labels of issue severity in the Scan report
- Stop hiding debug logs in the Logging view in the Scan report

## Version 4.22.1 (February 13, 2024)

- Fix issue where the temp apis on the platform were not properly cleaned up

## Version 4.22.0 (February 13, 2024)

- Check for updates of the 42Crunch AST binary and prompt user to upgrade
- Add support for BOLA/BFLA tests in Scan UI

## Version 4.21.1 (January 22, 2024)

- Fix for creating temp APIs when API Naming Convention is configured
- Fixes for form validation in Settings webapp

## Version 4.21.0 (January 18, 2024)

- Change scope of a number of configuration settings to "machine", to disallow overriding
  this in a workspace, as having different per-workspace settings for likes of "platformUrl"
  was very confusing.

## Version 4.20.0 (January 11, 2024)

- Implement context menu command to remove operations and paths in OpenAPI Explorer view
- Allow configuring name of a temporary collection when using 42Crunch Platform for performing Security Audit,
  and make sure it matches org's collection naming convention
- Allow specifying a list of tags to be automatically added to all APIs created by the extention on 42Crunch platform
- Fix display of SQG configuration for audits executed using 42Crunch Platform
- In 42Crunch Platform explorer view, APIs with 'technical names' are made read-only, and if possible a link
  to a filesystem location for relevant OpenAPI file is provided

## Version 4.19.5 (January 8, 2024)

- Fix issue when dots in operationId prevented 'Try' in Scan UI from sending the request

## Version 4.19.2 (December 5, 2023)

- Add Scan/Audit/Try it commands to the context menu in the OpenAPI tree
- Cleanup context menu titles removing 'OpenAPI:' prefix
- Update schemas for 42Crunch protection-types extensions
- Show extra logs when running Conformance Scan

## Version 4.19.0 (November 29, 2023)

- New OpenAPI tree, with individual sections merged into one tree and new Search functionality.
- Support for running Security Audit and Conformance Scan locally, using 42Crunch CLI binaries.
- New UI for API Conformance Scan with support for scenarios, authentication, etc.

## Version 4.18.6 (August 2, 2023)

- Fixes to support updated scan report

## Version 4.18.2 (June 9, 2023)

- Fix bug with sorting and filtering issues in Security Audit report

## Version 4.18.1 (June 5, 2023)

- Update styling of Security Audit Report
- Display SQG status in Security Audit
- Add filtering to Conformance Scan and Security Audit reports
- Implement single-operation Security Audit
- Add configuration option to disable use of CodeLenses #185

## Version 4.17.0 (May 12, 2023)

- Add support running Conformance Scan using scand-manager
- Add Settings webapp
- Update Data Dictionary browser UI
- Show Audit report in case pre-scan Audit fails

## Version 4.16.6 (April 7, 2023)

- Fix issue in TryIt where request parameters couldn't be deleted

## Version 4.16.5 (April 4, 2023)

- Fix issue where TryIt woudln't use value defined in parameter's 'example' #213
- Fix issue where Scan report incorrectly shows that response code wasn't found
- Fix color for trashcan icon in the dark theme

## Version 4.16.4 (March 29, 2023)

- Fix issue with TryIt request body editing input failing on invalid JSON
- Improve errors displaying when editing request parameters in TryIt

## Version 4.16.3 (March 24, 2023)

- Fix issue with TryIt failing on Swagger/OpenAPI files with no servers or host defined

## Version 4.16.2 (March 23, 2023)

- Fix issue with TryIt failing to display UI #209

## Version 4.16.1 (March 22, 2023)

- Fix issue with extra quotes added by intellisence #210

## Version 4.16 (March 21, 2023)

- Add support for Swagger 2.0 in TryIt and Conformance Scan
- Restyle TryIt and Scan UI

## Version 4.15 (October 28, 2022)

- Add support for single operation Conformance Scan

## Version 4.14 (September 9, 2022)

- Update Data Dictionary to use "format" attribute instead of x-42c-format
- Update Security Audit report
- Offer to update OpenAPI document using information from Data Dictionary prior to running Security Audit

## Version 4.13 (August 16, 2022)

- Fix performance degradation when editing large documents, #178
- Fix attempt to resolve $ref's in staged git changes, #179
- Stop trying to resolve $ref's in non-OpenAPI documents unless the document is referred by other OpenAPI document, #171

## Version 4.12 (August 11, 2022)

- Add TryIt feature to allow sending HTTP requests directly from the extension

## Version 4.11.4 (July 18, 2022)

- Miscelaneous improvements in data-dictionary linter

## Version 4.11.3 (July 14, 2022)

- Activate data-dictionary linter only when platform intergration is enabled

## Version 4.11.2 (July 7, 2022)

- Add data-dictionary to the platform integration

## Version 4.9.5 (April 27, 2022)

- Remove scan command from platform integration

## Version 4.9.4 (April 19, 2022)

- Fix issue #169 where rendering of 'application/xml' schemas in SwaggerUI preview would fail
- Update quickfixes to use new keys in Audit KDB

## Version 4.9.3 (March 16, 2022)

- Check 42Crunch platform naming conventions in 42Crunch platform integration component
- Fix x-42c-sample schema definition
- Update SwaggerUI version used in preview

## Version 4.9.2 (March 2, 2022)

- Updated schema with 42Crunch extensions definitions

## Version 4.9.1 (Feburary 23, 2022)

- Update webapp for displaying Security Audit reports
- Update preview to use the latest versions of SwaggerUI and Redoc
- Add command to load Security Audit report from file

## Version 4.8.2 (January 24, 2022)

- Fix incorrect schemas for 42Crunch extensions
- Fix issue with setting platform-related properties on extension activation
- KDB articles moved online

## Version 4.8.0 (January 4, 2022)

- Add optional integration with 42Crunch Platform
- Fix issue #156 where a file with external $refs was failing to generate preview
- Improve autocompletion for $refs in YAML files

## Version 4.7.1 (December 17, 2021)

- Update KDB articles for Security Audit
- Fix issue #151 where tabs in YAML OpenAPI file were preventing preview from being shown
- Fix issues #145 and #146 by allowing to configure preview update interval
- Fix issue #154 where editing unnamed YAML file resulted in opening new files
- Autocomplete x-42c custom properties
- Complete migration to a new YAML/JSON AST parser library

## Version 4.6.4 (October 11, 2021)

- Update KDB articles for Security Audit

## Version 4.6.3 (September 2, 2021)

- Fix issue #140 an audit regression caused by previous update
- Fix issue with quickfix formatting in YAML files

## Version 4.6.1 (August 31, 2021)

- Fix issue #85 adding support for integers longer than MAX_SAFE_INTEGER
- Report duplicate keys and comments in JSON as errors
- Prohibit using JSONC with trailing commas
- Retain formatting of an integer values with trailing .0

## Version 4.5.2 (May 31, 2021)

- Update audit KDB artciles
- Update Swagger UI to 3.48.0

## Version 4.5.1 (May 6, 2021)

- Declare support for untrusted and virtual workspaces in the extension manifest
- Fix 42Crunch icon affected by VS Code update

## Version 4.5 (April 15, 2021)

- Trigger $ref autocompletion on single quotes when editing YAML file (contributed by @klementtan)
- Update KDB articles

## Version 4.4.1 (April 12, 2021)

- Fix regressions introduced in previous release

## Version 4.4.0 (April 6, 2021)

- Add 'Operation ID' panel to OpenAPI tree view
- Fix issues with preview generation [Issue #123](https://github.com/42Crunch/vscode-openapi/issues/123)

## Version 4.3.1 (March 30, 2021)

- Fix styling issue in preview [Issue #121](https://github.com/42Crunch/vscode-openapi/issues/121)
- Do not unnecessarily re-render the preview when switching away to the editor pane.

## Version 4.3.0 (March 24, 2021)

- Fix issue working with multi-file Swagger 2.0 files

## Version 4.2.0 (March 9, 2021)

- Update KDB articles and migrate to new security audit service

## Version 4.1.1 (March 5, 2021)

- Fix issue where remote reference was not handled correctly [Issue #115](https://github.com/42Crunch/vscode-openapi/issues/115)

## Version 4.1.0 (March 2, 2021)

- Update security audit report styling
- Fix malformed URI exception when running audit [Issue #114](https://github.com/42Crunch/vscode-openapi/issues/114)

## Version 4.0.3 (February 26, 2021)

- Fix go to reference issue [Issue #113](https://github.com/42Crunch/vscode-openapi/issues/113)

## Version 4.0.2 (February 24, 2021)

- Implemented quickfixes for Security Audit
- Implemented support for external (http:// and https://) $refs resolving [Issue #101](https://github.com/42Crunch/vscode-openapi/issues/101) [Issue #102](https://github.com/42Crunch/vscode-openapi/issues/102)
- Published extension to OpenVSX registry resolving [Issue #98](https://github.com/42Crunch/vscode-openapi/issues/98)

## Version 3.10.0 (January 5, 2021)

- Implemented quickfix functionality to resolve a subset of audit issues.
- Fixed Identify bad or invalid $ref's with a warning [Issue #86](https://github.com/42Crunch/vscode-openapi/issues/86)

## Version 3.9.0 (December 4, 2020)

- Added a button to create new OpenAPI file from the welcome view.
- Audit report now shows YAML examples in addition to JSON examples.
- Fixed Audit request fails when using yaml anchors [Issue #100](https://github.com/42Crunch/vscode-openapi/issues/100)

## Version 3.8.0 (November 12, 2020)

- Added new command to copy JSON Pointer of the selected item in the outline. See [Issue #37](https://github.com/42Crunch/vscode-openapi/issues/37)
- Made OpenAPI icon and the outline visible at all times. See [Issue #78](https://github.com/42Crunch/vscode-openapi/issues/78)
- Fixed not working SwaggerUI Try Out feature [Issue #80](https://github.com/42Crunch/vscode-openapi/issues/80)
- Fixed errors being shown for VS Code json files [Issue #81](https://github.com/42Crunch/vscode-openapi/issues/81)
- Added keyboard shortcut for OpenAPI preview [Issue #83](https://github.com/42Crunch/vscode-openapi/issues/83)
- Fixed confusing error message for invalid OpenAPI files [Issue #84](https://github.com/42Crunch/vscode-openapi/issues/84)

## Version 3.7.0 (September 24, 2020)

- Added 'preview' button to the toolbar do display preview using the default renderer (configurable in the settings)
- Update Security Audit articles

## Version 3.6.0 (September 2, 2020)

- Merged ([PR #775](https://github.com/42Crunch/vscode-openapi/pull/75)) by @gayanper: Add autocompletion support for remote references and support for both single and double qoutes
- Added support for generating preview of OpenAPI documentation with [Swagger UI](https://swagger.io/tools/swagger-ui/) and [ReDoc](https://github.com/Redocly/redoc)

## Version 3.5.0 (July 31, 2020)

- Fixed ([#72](https://github.com/42Crunch/vscode-openapi/issues/72)): API tab not showing with SSH FS
- Add new command: Copy JSON Reference for the element under the cursor
- Show issue IDs in security audit reports

## Version 3.4.0 (July 9, 2020)

- Add JSONC support, including support for multi-file OpenAPI files
- Update Security Audit articles to match changes in the backend service
- Remove use of deprecated vscode-resource scheme

## Version 3.3.0 (June 16, 2020)

- Update Security Audit articles to match changes in the backend service
- Changes from @gayanper to improve completions

## Version 3.2.0 (May 20, 2020)

- Update Security Audit articles to match changes in the backend service

## Version 3.1.2 (May 15, 2020)

- Improve $ref autocompletion

## Version 3.1.1 (May 11, 2020)

- Update Security Audit articles to match changes in the backend service

## Version 3.1.0 (April 23, 2020)

- Fixed issue with multifile OAS bundling described in ([#54](https://github.com/42Crunch/vscode-openapi/issues/54)): Audit fails with $ref that points to another file and contains ~1
- Fixes in YAML and JSON $ref completion

## Version 3.0.1 (April 6, 2020)

- Support files with external $refs in 42Crunch API Contract Security Audit

## Version 2.1.2 (March 23, 2020)

- Fixed ([#46](https://github.com/42Crunch/vscode-openapi/issues/46)): Bug: Problems loading reference 'openapi-schemas:openapi-2.0.json'
- Fixed ([#45](https://github.com/42Crunch/vscode-openapi/issues/45)): "JS-YAML: expected a single document in the stream, but found more" on non-OpenAPI YAML files
- Fixed ([#38](https://github.com/42Crunch/vscode-openapi/issues/38)): Remove category "Language Packs" from extension package.json

## Version 2.1.1 (February 27, 2020)

- Fixed ([#41](https://github.com/42Crunch/vscode-openapi/issues/41)): Honor 'yaml.customTags' setting

## Version 2.1.0 (December 20, 2019)

- Provide autocompletion for $ref's in YAML files.
- Fix issue where Go To Definition would not work, if the reference is made to the entire file (i.e., without '#' in ref)
- Display 'no assessment report' in the assessment report pane if the currently active editor has no report available

## Version 2.0.2 (November 27, 2019)

- Display relevant assessment report (if assessment result is known for a file) when switching between editors
- Alphabetically sort entries in OpenAPI Explorer (sorting can be disabled in Settings)
- Fixed issue where OpenAPI Explorer will not update when switching to an invalid .json or .yaml file
- Fixed ([#34](https://github.com/42Crunch/vscode-openapi/issues/34)): Go to definition wouldn't work for paths with curly braces

## Version 2.0.1 (November 13, 2019)

- Misc improvements for assessment report
- Display responses and parameters in for operations
- Do not blank contents of OpenAPI expolrer on syntax errors

## Version 1.8.21 (October 25, 2019)

- Remove 'OpenAPI file is invalid' message displayed in assessment report in case of structual errors in OpenAPI file

## Version 1.8.20 (October 23, 2019)

- Fix issue with assessment report where some low priority issues were shown as a high priority ones
- Reverse sort order for issues in assessment report

## Version 1.8.19 (October 8, 2019)

- Fixed ([#22](https://github.com/42Crunch/vscode-openapi/issues/22)): API Viewer goes blank after git add
- Fixed ([#6](https://github.com/42Crunch/vscode-openapi/issues/6)): API icon disappears on Color Theme change and zoom in/out

## Version 1.8.18 (October 8, 2019)

- Fixed ([#18](https://github.com/42Crunch/vscode-openapi/issues/18)): Duplicate paths cause API viewer to go blank
- Fixed ([#21](https://github.com/42Crunch/vscode-openapi/issues/21)): Support for splitted files definitions

## Version 1.8.17 (October 3, 2019)

- Added integration with 42Crunch API Contract Security Audit

## Version 1.8.13 (September 24, 2019)

- Fixed ([#17](https://github.com/42Crunch/vscode-openapi/issues/17)): Provide workaround for validation of remaining relative URLs

## Version 1.8.12 (August 30, 2019)

- Relax OpenAPIv3 schema definition of $ref to workaround errorneous problem reported for $ref by YAML extension 0.5.2

## Version 1.8.11 (August 30, 2019)

- Increase activity bar icon size
- Remove warning for YAML 0.5.1 extension

## Version 1.8.10 (August 26, 2019)

- Extension has been updated to require newer version of VS Code (1.37.1)
- Fixed ([#11](https://github.com/42Crunch/vscode-openapi/issues/11)): Takes keybindings.json as OAS file
- Fixed ([#13](https://github.com/42Crunch/vscode-openapi/issues/13)): External file $refs not supported by jump to definition

## Version 1.8.8 (July 25, 2019)

- Fixed ([#10](https://github.com/42Crunch/vscode-openapi/issues/10)): Go to Definition doesn't work on YAML flow style mapping

## Version 1.8.7 (July 16, 2019)

- Fixed ([#9](https://github.com/42Crunch/vscode-openapi/issues/9)): JSON schema to avoid picking up non-OpenAPI JSON files.

## Version 1.8.6 (July 16, 2019)

- Fixed ([#7](https://github.com/42Crunch/vscode-openapi/issues/7)): check values of "openapi"/"swagger" attributes before activating plugin and applying schemas, so that the extension does not get activated by opening non-OpenAPI files.

## Version 1.8.3 (July 5, 2019)

- Implemented modifying YAML files with outline commands

## Version 1.7.2 (June 26, 2019)

- Implemented Go to definition for $ref in YAML

## Version 1.7.1 (June 24, 2019)

- Basic YAML support

## Version 1.6.6 (June 12, 2019)

- Fixed ([#1](https://github.com/42Crunch/vscode-openapi/issues/1))

## Version 1.6.5 (June 10, 2019) - Initial public release

- JSON OpenAPI v2 and v3 support
- Intellisense
- Navigation pane
- Code snippets
- Go to definition
- Schema enforcement
