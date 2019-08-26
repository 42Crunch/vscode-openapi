# Changelog

## Version 1.8.10 (August 27, 2019)
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
