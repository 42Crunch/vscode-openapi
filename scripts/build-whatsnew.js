#!/usr/bin/env node

const fs = require('fs');
const marked = require('marked');

const whatsnew = fs.readFileSync('WHATS-NEW.md', { encoding: 'utf8' });
const html = marked(whatsnew, {
  baseUrl: 'https://github.com/42Crunch/vscode-openapi/raw/master/'
});
console.log('Writing webview/generated/whatsnew.html');
if (!fs.existsSync('webview/generated')) {
  fs.mkdirSync('webview/generated');
}
fs.writeFileSync('webview/generated/whatsnew.html', html, {encoding: 'utf8'});
