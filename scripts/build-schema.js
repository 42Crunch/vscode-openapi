#!/usr/bin/env node

const fs = require("fs");

const x42Defs = JSON.parse(fs.readFileSync("schema/x42c.json", "utf8"));
const x42Config = JSON.parse(fs.readFileSync("schema/x42c-config.json", "utf8"));

const schemasRoot = JSON.parse(fs.readFileSync("schema/openapi.json", "utf8"));
const schemasV2 = JSON.parse(fs.readFileSync("schema/openapi-2.0.json", "utf8"));
const schemasV3 = JSON.parse(fs.readFileSync("schema/openapi-3.0-2019-04-02.json", "utf8"));

Object.assign(schemasV2.definitions, x42Defs.definitions);
Object.assign(schemasV3.definitions, x42Defs.definitions);

for (const conf of x42Config) {
  for (const path of conf.paths) {
    const pointer = getPointer(path);
    if (pointer) {
      const schema = path.startsWith("openapi-2.0.json") ? schemasV2 : schemasV3;
      const targetSchema = getJsonByPointer(schema, pointer);
      if (targetSchema) {
        Object.assign(targetSchema, conf.schemas);
      } else {
        console.error("ERROR: Target schema not found " + path + " (" + pointer + ")");
      }
    } else {
      console.error("ERROR: Path not found " + path);
    }
  }
}

if (!fs.existsSync("schema/generated")) {
  fs.mkdirSync("schema/generated");
}

function getPointer(jsonPath) {
  const items = jsonPath.split("#");
  return items.length === 2 ? items[1] : null;
}

function getJsonByPointer(obj, pointer) {
  if (pointer === "") {
    return obj;
  }
  var items = pointer.substring(1).split(/\//).map(unescape);

  for (const item of items) {
    if (typeof obj === "object" && item in obj) {
      obj = obj[item];
    } else {
      return null;
    }
  }
  return obj;
}

function unescape(str) {
  return str.replace(/~1/g, "/").replace(/~0/g, "~").replace(/\\\"/g, '"').replace(/\\\\/g, "\\");
}

function writeFileSync(file, obj) {
  fs.writeFileSync("schema/generated/" + file, JSON.stringify(obj, null, 4));
}

writeFileSync("openapi.json", schemasRoot);
writeFileSync("openapi-2.0.json", schemasV2);
writeFileSync("openapi-3.0-2019-04-02.json", schemasV3);
