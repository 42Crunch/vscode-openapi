#!/usr/bin/env node

const fs = require("fs");
const marked = require("marked");

const x42Defs = JSON.parse(fs.readFileSync("schema/x42c.json", "utf8"));
const x42Config = JSON.parse(fs.readFileSync("schema/x42c-config.json", "utf8"));

const docsV3 = fs.readFileSync("schema/openapi-specification-3.0.0.md", "utf8");

function augmentDefinitionTitles(schema) {
  const objectsOfInterest = new Set(Object.keys(schema.definitions).map((key) => `${key} Object`));
  let activatedObject = undefined;

  const dictionary = {};

  marked.use({
    walkTokens: (token) => {
      if (token.type === "heading" && token.depth === 4) {
        const textToken = token.tokens.find((subtoken) => {
          return subtoken.type === "text";
        });

        if (objectsOfInterest.has(textToken.text)) {
          activatedObject = textToken.text;
        }
      }

      if (activatedObject && token.type === "paragraph") {
        if (!dictionary[activatedObject]) {
          Object.assign(dictionary, { [activatedObject]: { object: token.text } });
        }
      }

      if (
        activatedObject &&
        token.type === "table" &&
        token.header &&
        token.header[0] &&
        token.header[0].text === "Field Name"
      ) {
        const fields = token.rows.reduce((acc, row) => {
          const [fieldNameCell, , descriptionCell] = row;
          const fieldNameTextToken = fieldNameCell.tokens.find((subtoken) => {
            return subtoken.type === "text";
          });

          if (fieldNameTextToken) {
            acc[fieldNameTextToken.text.trim()] = descriptionCell.text;
          }

          return acc;
        }, {});
        const objectDictionaryEntry = dictionary[activatedObject];

        if (objectDictionaryEntry) {
          Object.assign(objectDictionaryEntry, { fields });
        }
      }
    },
  });

  marked.parse(docsV3);

  const nextSchema = {
    ...schema,
    definitions: {
      ...schema.definitions,
      ...Object.fromEntries(
        Object.entries(schema.definitions).map(([key, value]) => {
          const dictionaryEntry = dictionary[`${key} Object`];

          const isDictionaryEntryWithFields =
            dictionaryEntry && dictionaryEntry.fields && value.type === "object";

          const nextValue = {
            ...value,
            ...(dictionaryEntry
              ? { description: `${key} Object\n\n${dictionaryEntry.object}` }
              : undefined),
            ...(isDictionaryEntryWithFields && value.properties
              ? { properties: augmentProperties(value.properties, dictionaryEntry), }
              : undefined),
          };

          return [key, nextValue];
        })
      ),
    },
  };

  return nextSchema;
}

function augmentProperties(properties, dictionaryEntry) {
  return Object.fromEntries(
    Object.entries(properties).map(([propertyKey, propertyValue]) => {
      const fields = dictionaryEntry.fields;

      return [
        propertyKey,
        {
          ...propertyValue,
          ...(fields[propertyKey]
            ? { description: dictionaryEntry.fields[propertyKey] }
            : undefined),
        },
      ];
    })
  );
}

const schemasRoot = JSON.parse(fs.readFileSync("schema/openapi.json", "utf8"));
const schemasV2 = JSON.parse(fs.readFileSync("schema/openapi-2.0.json", "utf8"));
const schemasV3 = augmentDefinitionTitles(
  JSON.parse(fs.readFileSync("schema/openapi-3.0-2019-04-02.json", "utf8"))
);

const refs = new Set();
collectRefs("target", x42Config, refs);
collectRefs("$ref", x42Defs, refs);

const defs = new Set();
for (const key of Object.keys(x42Defs.definitions)) {
  defs.add(key);
}

for (const def of defs) {
  if (!refs.has(def)) {
    console.error("ERROR: Extension " + def + " is not used");
  }
}

function collectRefs(keyToFind, obj, refs) {
  const type = getType(obj);
  if (type === "object") {
    for (const key of Object.keys(obj)) {
      if (key === keyToFind) {
        refs.add(getLastPointerPart(obj[key]));
      }
      collectRefs(keyToFind, obj[key], refs);
    }
  } else if (type === "array") {
    for (let i = 0; i < obj.length; i++) {
      collectRefs(keyToFind, obj[i], refs);
    }
  }
}

function getLastPointerPart(jsonPath) {
  const items = jsonPath.split("/");
  return items[items.length - 1];
}

Object.assign(schemasV2.definitions, x42Defs.definitions);
Object.assign(schemasV3.definitions, x42Defs.definitions);

for (const conf of x42Config) {
  for (const path of conf.paths) {
    const pointer = getPointer(path);
    if (pointer) {
      const schema = path.startsWith("openapi-2.0.json") ? schemasV2 : schemasV3;
      const targetSchema = getJsonByPointer(schema, pointer);
      if (targetSchema) {
        unescapeRefKeys(conf.schemas);
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

function unescapeRefKeys(obj) {
  const type = getType(obj);
  if (type === "object") {
    for (const key of Object.keys(obj)) {
      if (key === "target") {
        obj["$ref"] = obj[key];
        delete obj[key];
        unescapeRefKeys(obj["$ref"]);
      } else {
        unescapeRefKeys(obj[key]);
      }
    }
  } else if (type === "array") {
    for (let i = 0; i < obj.length; i++) {
      unescapeRefKeys(obj[i]);
    }
  }
}

function getType(value) {
  const type = typeof value;
  if (type === "object") {
    return value === null ? "null" : value instanceof Array ? "array" : type;
  }
  return type;
}

writeFileSync("openapi.json", schemasRoot);
writeFileSync("openapi-2.0.json", schemasV2);
writeFileSync("openapi-3.0-2019-04-02.json", schemasV3);
