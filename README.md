# OpenAPI extension for Visual Studio Code

A [Visual Studio Code](https://code.visualstudio.com/) [extension](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi) with rich support for the OpenAPI (aka Swagger) language (v2 and v3 in JSON format), including features such as IntelliSense, linting, schema enforcement, code navigation, definition links, snippets, and more!

## Quick Start

Open any JSON file that contains OpenAPI v2 or OpenAPI v3 definition in VS Code. The plugin should automatically detect that this is an OpenAPI file. When it does, the OpenAPI icon <img src="https://raw.githubusercontent.com/42Crunch/vscode-openapi/master/images/OpenAPI%20button.PNG" width=20 height=19>  gets displayed in the left-hand panel.

<img src="https://github.com/42Crunch/vscode-openapi/blob/master/images/OpenAPI%20Explorer.PNG?raw=true" width=400 height=389>

## OpenAPI navigation
1. Open an OpenAPI file.
2. Click the OpenAPI button at the left-hand pane to switch to the OpenAPI explorer view.
3. Expand elements, click the elements to which you want to navigate in the editor.

![Navigation inside OpenAPI / swagger file](https://github.com/42Crunch/vscode-openapi/blob/master/images/Naviation.gif?raw=true)

## Add elements from OpenAPI explorer
In the left-hand OpenAPI explorer pane, click the ... menu in the section where you want to add the element and pick the corresponding item from the menu.

![Add new API path and verb](https://github.com/42Crunch/vscode-openapi/blob/master/images/Add%20paths%20and%20verbs.gif?raw=true)

## Intellisense

As you start typing OpenAPI elements and their values, context-relevant options get displayed in the intellisense menu. Just type double-quote (") to get it going.

![Intellisense for OpenAPI editing](https://github.com/42Crunch/vscode-openapi/blob/master/images/Intellisense.gif?raw=true)

## Go to definition

* Ctrl-click a reference
OR
* Right-click a reference and click "Go to Definition" on the shortcut menu

![Go to Definition](https://github.com/42Crunch/vscode-openapi/blob/master/images/Go%20to%20Definition.gif?raw=true)

## Create new OpenAPI files

1.  Press Ctrl-Shift-P on Windows or Cmd-Shift-P on a Mac.   
2.  In the command prompt, start typing `new openapi` and then click the corresponding command to get v2 or v3 file created.
3. The template file gets created. Use the OpenAPI explorer pane to populate it with new paths and other elements.

![Create new OpenAPI file from template](https://github.com/42Crunch/vscode-openapi/blob/master/images/New%20OpenAPI%20file.gif?raw=true)

## Feedback

Submit your issues, questions, and feature requests to the [GitHub project Issues](https://github.com/42Crunch/vscode-openapi/issues).
