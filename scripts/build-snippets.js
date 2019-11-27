#!/usr/bin/env node

const fs = require('fs');

const snippets = fs.readdirSync('snippets');
const result = {};

for(const name of snippets) {
  const text = fs.readFileSync(`snippets/${name}`, 'utf8');
  result[name] = text.substring(0, text.length - 1); // strip \n at the end
}

console.log(`Writing ${snippets.length} snippets to src/snippets.json`);
fs.writeFileSync('src/snippets.json', JSON.stringify(result, null, 2));
