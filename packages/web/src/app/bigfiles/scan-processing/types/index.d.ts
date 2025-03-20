/// <reference path="../../../../../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="../../../../../node_modules/@types/chart.js/index.d.ts" />

// It turned out we cannot include @types/resize-observer-browser in ts.config.
// TypeScript throws an error.
/// <reference types="resize-observer-browser" />

import './object';
import './string';
import './json-source-map';
import './chart';
import './storybook';
