import * as fs from "fs/promises";
import * as path from "path";

type Param = {
  label: string;
};

type Protection = {
  metadata: {
    title: string;
    name: string;
    version: string;
  };
  interface: {
    schema?: unknown;
    params?: Record<string, Param>;
  };
};

type Definitions = {
  definitions: Record<string, any>;
};

type ProtectionSchema = {
  type: "object";
  required: [string];
  properties: any;
  additionalProperties: false;
};

async function readProtections(dir: string): Promise<Protection[]> {
  const files = await fs.readdir(dir);
  const jsonFiles: string[] = files.filter((file) => path.extname(file).toLowerCase() === ".json");
  const parsedJsonArray: any[] = [];

  for (const jsonFile of jsonFiles) {
    const filePath = path.join(dir, jsonFile);
    const data = await fs.readFile(filePath, "utf8");
    const jsonData = JSON.parse(data);
    parsedJsonArray.push(jsonData);
  }

  return parsedJsonArray;
}

function extractDefinitions(protections: Protection[]): Definitions {
  const result: Definitions = { definitions: {} };
  for (const protection of protections) {
    const name = `${protection.metadata.name}_${protection.metadata.version}`;

    const schema: ProtectionSchema = {
      type: "object",
      required: [name],
      properties: {},
      additionalProperties: false,
    };

    if (protection.interface.schema) {
      schema.properties[name] = protection.interface.schema;
    } else {
      throw new Error(`No schema found for: ${name}`);
    }

    // use title as description
    if (schema.properties[name].description === undefined) {
      schema.properties[name].description = protection.metadata.title;
    }

    // use params label to set property description
    if (schema.properties[name].properties && protection.interface.params) {
      for (const property of Object.keys(schema.properties[name].properties)) {
        if (
          protection.interface.params[property] &&
          schema.properties[name].properties?.[property] &&
          schema.properties[name].properties?.[property]?.description === undefined
        ) {
          schema.properties[name].properties[property].description =
            protection.interface.params[property].label;
        }
      }
    }

    result.definitions[name] = schema;
  }
  return result;
}

function buildStrategy(definitions: Definitions, schema: any): any {
  const existing =
    schema?.definitions?.["X42cStrategy"]?.properties?.protections?.items?.anyOf || [];
  const names = Object.keys(definitions.definitions);

  const anyOf = [
    ...existing,
    ...names.map((name) => ({
      $ref: `#/definitions/${name}`,
    })),
  ];

  return {
    type: "object",
    properties: {
      protections: {
        type: "array",
        items: {
          anyOf: anyOf,
        },
      },
    },
  };
}

async function readSchema(): Promise<any> {
  const data = await fs.readFile("x42c-schema.json", "utf8");
  const parsed = JSON.parse(data);
  return parsed;
}

async function writeSchema(schema: any): Promise<void> {
  fs.writeFile("x42c-schema-converted.json", JSON.stringify(schema, null, 2), {
    encoding: "utf-8",
  });
}

async function convert() {
  const basic = await readProtections(
    "protection-types/basic-protections"
  );

  const composite = await readProtections(
    "protection-types/composite-protections"
  );

  const definitions = extractDefinitions([...basic, ...composite]);

  const schema = await readSchema();

  const strategy = buildStrategy(definitions, schema);

  definitions.definitions["X42cStrategy"] = strategy;

  schema.definitions = { ...schema.definitions, ...definitions.definitions };

  await writeSchema(schema);
}

convert();
