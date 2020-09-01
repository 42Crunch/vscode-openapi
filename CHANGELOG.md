# Changelog

## Version 3.6.0 (September 1, 2020)

* Merged ([PR #775](https://github.com/42Crunch/vscode-openapi/pull/75)) by @gayanper: Add autocompletion support for remote references and support for both single and double qoutes
* Added support for generating preview of OpenAPI documentation with (Swagger UI)[https://swagger.io/tools/swagger-ui/] and (ReDoc)[https://github.com/Redocly/redoc]

## Version 3.5.0 (July 31, 2020)
* Fixed ([#72](https://github.com/42Crunch/vscode-openapi/issues/72)): API tab not showing with SSH FS
* Add new command: Copy JSON Reference for the element under the cursor
* Show issue IDs in security audit reports

## Version 3.4.0 (July 9, 2020)
* Add JSONC support, including support for multi-file OpenAPI files
* Update Security Audit articles to match changes in the backend service
* Remove use of deprecated vscode-resource scheme

## Version 3.3.0 (June 16, 2020)
* Update Security Audit articles to match changes in the backend service
* Changes from @gayanper to improve completions

## Version 3.2.0 (May 20, 2020)
* Update Security Audit articles to match changes in the backend service

## Version 3.1.2 (May 15, 2020)
* Improve $ref autocompletion

## Version 3.1.1 (May 11, 2020)
* Update Security Audit articles to match changes in the backend service

## Version 3.1.0 (April 23, 2020)
* Fixed issue with multifile OAS bundling described in ([#54](https://github.com/42Crunch/vscode-openapi/issues/54)): Audit fails with $ref that points to another file and contains ~1
* Fixes in YAML and JSON $ref completion

## Version 3.0.1 (April 6, 2020)
* Support files with external $refs in 42Crunch API Contract Security Audit

## Version 2.1.2 (March 23, 2020)
* Fixed ([#46](https://github.com/42Crunch/vscode-openapi/issues/46)): Bug: Problems loading reference 'openapi-schemas:openapi-2.0.json'
* Fixed ([#45](https://github.com/42Crunch/vscode-openapi/issues/45)): "JS-YAML: expected a single document in the stream, but found more" on non-OpenAPI YAML files
* Fixed ([#38](https://github.com/42Crunch/vscode-openapi/issues/38)): Remove category "Language Packs" from extension package.json

## Version 2.1.1 (February 27, 2020)
* Fixed ([#41](https://github.com/42Crunch/vscode-openapi/issues/41)): Honor 'yaml.customTags' setting

## Version 2.1.0 (December 20, 2019)
* Provide autocompletion for $ref's in YAML files.
* Fix issue where Go To Definition would not work, if the reference is made to the entire file (i.e., without '#' in ref)
* Display 'no assessment report' in the assessment report pane if the currently active editor has no report available

## Version 2.0.2 (November 27, 2019)
* Display relevant assessment report (if assessment result is known for a file) when switching between editors
* Alphabetically sort entries in OpenAPI Explorer (sorting can be disabled in Settings)
* Fixed issue where OpenAPI Explorer will not update when switching to an invalid .json or .yaml file
* Fixed ([#34](https://github.com/42Crunch/vscode-openapi/issues/34)): Go to definition wouldn't work for paths with curly braces

## Version 2.0.1 (November 13, 2019)
* Misc improvements for assessment report
* Display responses and parameters in for operations
* Do not blank contents of OpenAPI expolrer on syntax errors

## Version 1.8.21 (October 25, 2019)
* Remove 'OpenAPI file is invalid' message displayed in assessment report in case of structual errors in OpenAPI file

## Version 1.8.20 (October 23, 2019)
* Fix issue with assessment report where some low priority issues were shown as a high priority ones
* Reverse sort order for issues in assessment report

## Version 1.8.19 (October 8, 2019)
* Fixed ([#22](https://github.com/42Crunch/vscode-openapi/issues/22)): API Viewer goes blank after git add
* Fixed ([#6](https://github.com/42Crunch/vscode-openapi/issues/6)): API icon disappears on Color Theme change and zoom in/out

## Version 1.8.18 (October 8, 2019)
* Fixed ([#18](https://github.com/42Crunch/vscode-openapi/issues/18)): Duplicate paths cause API viewer to go blank
* Fixed ([#21](https://github.com/42Crunch/vscode-openapi/issues/21)): Support for splitted files definitions

## Version 1.8.17 (October 3, 2019)
* Added integration with 42Crunch API Contract Security Audit

## Version 1.8.13 (September 24, 2019)
* Fixed ([#17](https://github.com/42Crunch/vscode-openapi/issues/17)): Provide workaround for validation of remaining relative URLs

## Version 1.8.12 (August 30, 2019)
* Relax OpenAPIv3 schema definition of $ref to workaround errorneous problem reported for $ref by YAML extension 0.5.2

## Version 1.8.11 (August 30, 2019)
* Increase activity bar icon size
* Remove warning for YAML 0.5.1 extension

## Version 1.8.10 (August 26, 2019)
* Extension has been updated to require newer version of VS Code (1.37.1)
* Fixed ([#11](https://github.com/42Crunch/vscode-openapi/issues/11)): Takes keybindings.json as OAS file
* Fixed ([#13](https://github.com/42Crunch/vscode-openapi/issues/13)): External file $refs not supported by jump to definition

## Version 1.8.8 (July 25, 2019)
* Fixed ([#10](https://github.com/42Crunch/vscode-openapi/issues/10)): Go to Definition doesn't work on YAML flow style mapping

## Version 1.8.7 (July 16, 2019)
* Fixed ([#9](https://github.com/42Crunch/vscode-openapi/issues/9)): JSON schema to avoid picking up non-OpenAPI JSON files.

## Version 1.8.6 (July 16, 2019)
* Fixed ([#7](https://github.com/42Crunch/vscode-openapi/issues/7)): check values of "openapi"/"swagger" attributes before activating plugin and applying schemas, so that the extension does not get activated by opening non-OpenAPI files.

## Version 1.8.3 (July 5, 2019)
* Implemented modifying YAML files with outline commands

## Version 1.7.2 (June 26, 2019)
* Implemented Go to definition for $ref in YAML

## Version 1.7.1 (June 24, 2019)
* Basic YAML support

## Version 1.6.6 (June 12, 2019)
* Fixed ([#1](https://github.com/42Crunch/vscode-openapi/issues/1))

## Version 1.6.5 (June 10, 2019) - Initial public release
* JSON OpenAPI v2 and v3 support
* Intellisense
* Navigation pane
* Code snippets
* Go to definition
* Schema enforcement
