# OpenAPI extension for Visual Studio Code

This [Visual Studio Code](https://code.visualstudio.com/) (VS Code) [extension](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi) adds rich support for the [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification) (OAS) (formerly known as Swagger Specification) in JSON or YAML format. The features include, for example, IntelliSense, linting, schema enforcement, code navigation, definition links, snippets, static security analysis, and more! 

The extension also integrates with [API Contract Security Audit](https://docs.42crunch.com/latest/content/concepts/api_contract_security_audit.htm) by 42Crunch, so that you can check the quality of your API definition directly in VS Code.

Both OAS v2 and v3 are supported.

## Table of contents

- [Quick start](#quick-start)
- [Use the extension while editing your API](#use-the-extension-while-editing-your-API)
  * [Create new OpenAPI files](#create-new-openapi-files)
  * [Navigate API definition](#navigate-API-definition)
  * [Add new elements in the OpenAPI explorer](#add-new-elements-in-the-openapi-explorer)
  * [Use IntelliSense](#use-intellisense)
  * [Jump to a reference](#jump-to-a-reference)
  * [Sort entries in the navigation pane](#sort-entries-in-the-navigation-pane)
  * [Preview OpenAPI documentation](#preview-openapi-documentation)
- [Use the extension to audit your API](#use-the-extension-to-audit-your-API)
  * [Navigate the issues in the audit report](#navigate-the-issues-in-the-audit-report)
- [Known issues](#known-issues)
- [Feedback](#feedback)

## Quick start

After installing the plugin, open any JSON or YAML file that contains an OpenAPI definition in VS Code. The plugin automatically detects that this is an OpenAPI file, and the OpenAPI button <img src="https://raw.githubusercontent.com/42Crunch/vscode-openapi/master/images/OpenAPI%20button.PNG" width=20 height=19> is shown in the left-hand panel.

![OpenAPI Explorer](images/OpenAPI%20Explorer.PNG)

## Use the extension while editing your API

OpenAPI extension makes it easier and faster to navigate your OpenAPI definitions, especially when they get longer. 

You can home in on elements in the OpenAPI explorer view, or jump directly to the target of a reference in the API. You can also add new elements to your API directly in the OpenAPI explorer directly where they are needed. Filling in the details is quicker with IntelliSense support for OpenAPI elements.

### Create new OpenAPI files

1. Press **Ctrl+Shift+P** on Windows or Linux, or **Cmd+Shift+P** on a Mac.   
2. In the command prompt, start typing `new openapi`, and click the corresponding command to create either an OAS v2 or v3 template file.
3. Use the OpenAPI explorer to populate the template with new paths and other elements as needed.
4. Save the file to your disk to fully enable IntelliSense.

![Create new OpenAPI file from a template](https://github.com/42Crunch/vscode-openapi/blob/master/images/New%20OpenAPI%20file.gif?raw=true)

### Navigate API definition
1. Open an OpenAPI file.
2. Click the OpenAPI button to switch to the OpenAPI explorer view.
3. Expand the sections and elements in the file as needed, and click the ones you want to jump to in the editor.

![Navigation inside the OpenAPI file](https://github.com/42Crunch/vscode-openapi/blob/master/images/Naviation.gif?raw=true)

### Add new elements in the OpenAPI explorer
1. In OpenAPI explorer pane, go to the section where you want to add a new element, and click the **...** menu.
2. Click the item you want to add from the dropdown list.

![Add new API path and verb](https://github.com/42Crunch/vscode-openapi/blob/master/images/Add%20paths%20and%20verbs.gif?raw=true)

### Use IntelliSense

As you start typing OpenAPI elements or their values, the context-sensitive list of available options is displayed in the IntelliSense menu. In JSON OpenAPI files, just type double-quote (`"`) to show the menu, and type further to filter the list. In YAML OpenAPI files, start typing the property name.

You can also use the corresponding VS Code hotkey (**Ctrl+Space** on Windows, **Cmd+Space** on Mac) to open the IntelliSense menu.

![IntelliSense for OpenAPI editing](https://github.com/42Crunch/vscode-openapi/blob/master/images/Intellisense.gif?raw=true)

### Jump to a reference

Use Go to Definition to locate the targets of references easily. To jump to view the definition from a reference in your API, either **Ctrl+click** a reference, or right-click a reference and click **Go to Definition** in the shortcut menu.

![Go to definition](https://github.com/42Crunch/vscode-openapi/blob/master/images/Go%20to%20Definition.gif?raw=true)

### Sort entries in the navigation pane

By default, entries in the OpenAPI Explorer pane are sorted alphabetically. If you want to instead have them sorted in the order they are in the OpenAPI file, change the corresponding setting:
1. On the **File** menu, click **Preferences > Settings**.
2. Expand the **Extensions** section and click **OpenAPI**.
3. Clear the checkbox **Alphabetically sort contents of OpenAPI explorer outlines**.


### Preview OpenAPI documentation

You can easily convert your OpenAPI files to human-readable HTML documentation that describes how to use your API.
Our extension supports two popular libraries that perform such conversion: [SwaggerUI](https://swagger.io/tools/swagger-ui/) and [ReDoc](https://github.com/Redocly/redoc).

To open the preview of the API documentation, execute the relevant command from the Command Palette (use Cmd+Shift+P or Ctrl+Shift+P to open the palette):

* OpenAPI: Preview with Swagger UI
* OpenAPI: Preview with ReDoc


## Use the extension to audit the security of your API

You can use OpenAPI extension to check the quality of your API as you work on it. You can run the audit directly from VS Code by clicking the **42C** button in the upper right corner.

To run Security Audit from VS Code, you need a token. On the first time, you are asked to provide your email address. When you supply the address, the extension requests the token to be sent to your mailbox. Once you get the token, paste it in the prompt in VS Code, and you are all set. From now on, all you need to do is to click the button to run the audit.

### Navigate the issues in the audit report

After the audit finishes, you get the audit report directly in the VS Code view, side by side with your code. Depending on your API definition, the report might be long, so here are some handy ways to navigate the found issues.

1. To scroll through all issues and their details, use the text panel on the right.

![Perform REST API Security Audit](https://github.com/42Crunch/vscode-openapi/blob/master/images/Perform%20REST%20API%20Security%20Audit.gif?raw=true)

2. Hover on an element that is underlined or marked with three dots (recommendations) in your code to see what the issues in that spot are. If you click on view the descriptions of only these issues, the rest of details are filtered out from the text panel, so you have less to scroll through.

![Details for specific issues](https://github.com/42Crunch/vscode-openapi/blob/master/images/Details%20for%20specific%20issues.gif?raw=true)

3. For a quick overall look, check the counts in the Status Bar. The different icons match the severity of the issue:
  - Error: critical or high 
  - Warning: medium
  - Info: low
  
![List of API Sec Issues](https://github.com/42Crunch/vscode-openapi/blob/master/images/List%20of%20API%20Sec%20Issues.gif?raw=true)

4. Click the icons in the Status Bar to open the PROBLEMS panel and scroll through the issue titles. The issues are ordered from most to least severe, so it is easy for fix the worst offenders first. Note that recommendations are not listed in the PROBLEMS panel.
5. Click on an issue in the PROBLEMS panel to jump to view it inline in your API definition.

## Known issues

- For new files, IntelliSense does not work until you save the file. File extension must be `.json` or `.yaml`.
- When you expand the sections and elements in the OpenAPI explorer, if the the left-hand panel gets very long, VS Code may push the last sections out of the UI. To view the sections that got pushed out, minimize the sections and elements you do not need. There is no scroll bar (yet) for the explorer section.

## Feedback

When you have a minute **PLEASE** submit your feedback and feature requests at [this superquick survey](https://www.surveymonkey.com/r/H3C8VC6).

Submit your bug reports at [GitHub project Issues](https://github.com/42Crunch/vscode-openapi/issues).

And, needless to say, your reviews at [VS Code marketplace](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi&ssr=false#review-details) mean the world to us!
