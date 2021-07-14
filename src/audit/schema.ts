interface ArraySchema {
  type: string;
  items: any;
}

interface ObjectSchema {
  type: string;
  properties: object;
  required: string[];
}

function isMixedTypeArray(json: Array<any>): boolean {
  if (json.length > 1) {
    const type: string = getType(json[0]);
    for (const value of json) {
      if (type !== getType(value)) {
        return true;
      }
    }
  }
  return false;
}

function getSchemaForMixedArray(json: Array<any>): ArraySchema {
  const schema: ArraySchema = {
    type: "array",
    items: {
      oneOf: [],
    },
  };

  for (const value of json) {
    const itemType = getType(value);
    let valueSchema: any;

    if (itemType === "object") {
      if (schema.items.properties) {
        schema.items.required = schema.items.required || [];
        updateRequiredList(schema.items.properties, value, schema.items.required);
      }
      const nextSchema = {
        type: "object",
        properties: {},
        required: [],
      };
      valueSchema = getSchemaForObject(value, nextSchema);
    } else if (itemType === "array") {
      if (isMixedTypeArray(value)) {
        valueSchema = getSchemaForMixedArray(value);
      } else {
        valueSchema = getSchemaForUniformArray(value);
      }
    } else {
      valueSchema = {
        type: itemType,
      };
    }
    addToOneOf(schema.items.oneOf, valueSchema);
  }
  return schema;
}

function getSchemaForUniformArray(json: Array<any>): ArraySchema {
  const schema: ArraySchema = {
    type: "array",
    items: {},
  };
  const schemas: Array<ArraySchema> = [];

  for (const value of json) {
    const itemType = getType(value);
    schema.items.type = itemType;

    if (itemType === "object") {
      if (schema.items.properties) {
        schema.items.required = schema.items.required || [];
        updateRequiredList(schema.items.properties, value, schema.items.required);
      }
      const nextSchema = {
        type: "object",
        properties: schema.items.properties,
        required: [],
      };
      schema.items.properties = getSchemaForObject(value, nextSchema).properties;
    } else if (itemType === "array") {
      if (isMixedTypeArray(value)) {
        schemas.push(getSchemaForMixedArray(value));
      } else {
        schemas.push(getSchemaForUniformArray(value));
      }
    }
  }

  if (schemas.length > 0) {
    if (schemas.length > 1) {
      schema.items = schemas;
    } else {
      schema.items = schemas[0];
    }
  }
  return schema;
}

function getSchemaForObject(json: any, schema?: ObjectSchema): ObjectSchema {
  if (schema) {
    schema.type = "object";
    schema.properties = schema.properties || {};
    schema.required = Object.keys(json);
  } else {
    schema = {
      type: "object",
      properties: {},
      required: Object.keys(json),
    };
  }

  for (const key in json) {
    const value = json[key];
    const type = getType(value, true);

    if (type === "object") {
      schema.properties[key] = getSchemaForObject(value, schema.properties[key]);
    } else if (type === "array") {
      schema.properties[key] = isMixedTypeArray(value)
        ? getSchemaForMixedArray(value)
        : getSchemaForUniformArray(value);
    } else if (schema.properties[key]) {
      const entry = schema.properties[key];
      if (Array.isArray(entry.type)) {
        if (entry.type.indexOf(type) === -1) {
          entry.type.push(type);
        }
      } else {
        if (entry.type !== type) {
          entry.type = [entry.type, type];
        }
      }
    } else {
      schema.properties[key] = {
        type: type,
      };
    }
  }
  return schema;
}

export function generateOneOfSchema(json: Array<any>): ObjectSchema | ArraySchema {
  const result: any = {
    oneOf: [],
  };
  for (const jsonEx of json) {
    let addToOneOf = true;
    const schema = generateSchema(jsonEx);
    for (const oneOfSchema of result["oneOf"]) {
      if (isEqual(schema, oneOfSchema)) {
        addToOneOf = false;
      }
    }
    if (addToOneOf) {
      result["oneOf"].push(schema);
    }
  }
  if (result["oneOf"].length == 1) {
    return result["oneOf"][0];
  }
  return result;
}

export function generateSchema(json: any): ObjectSchema | ArraySchema {
  const result: any = {
    type: getType(json),
  };
  if (result.type === "object") {
    const schema = getSchemaForObject(json);
    result.type = schema.type;
    result.properties = schema.properties;
    result.required = Object.keys(json).filter(function (key) {
      return !key.startsWith("$");
    });
  } else if (result.type === "array") {
    const schema = isMixedTypeArray(json)
      ? getSchemaForMixedArray(json)
      : getSchemaForUniformArray(json);
    result.type = schema.type;
    result.items = schema.items;
  }
  return result;
}

function getType(value: any, nullForUndefined?: boolean): string {
  const type = typeof value;
  if (type === "object") {
    return value === null ? "null" : value instanceof Array ? "array" : type;
  } else if (type === "number") {
    return Number.isInteger(value) ? "integer" : type;
  } else if (nullForUndefined === true && type === "undefined") {
    return "null";
  }
  return type;
}

function updateRequiredList(properties: object, value: object, required: Array<string>): void {
  for (const key of Object.keys(value)) {
    const index: number = required.indexOf(key);
    if (!(key in properties)) {
      if (index >= 0) {
        required.splice(index, 1);
      }
    } else if (index === -1) {
      required.push(key);
    }
  }
}

function addToOneOf(oneOf: Array<ArraySchema>, schema: ArraySchema): void {
  const type = schema.type;
  if (type !== "object" && type !== "array") {
    for (const oneOfSchema of oneOf) {
      if (oneOfSchema.type === type) {
        return;
      }
    }
  }
  oneOf.push(schema);
}

function isEqual(o1: any, o2: any): boolean {
  if (o1 === o2) {
    return true;
  }
  const type = getType(o1);
  if (type !== getType(o2)) {
    return false;
  } else {
    switch (type) {
      case "object":
        const keys1 = Object.keys(o1);
        const keys2 = Object.keys(o2);
        if (keys1.length !== keys2.length) {
          return false;
        } else {
          for (const key of keys1) {
            if (key in o2) {
              if (!isEqual(o1[key], o2[key])) {
                return false;
              }
            } else {
              return false;
            }
          }
          return true;
        }
      case "array":
        if (o1.length !== o2.length) {
          return false;
        } else {
          for (let i = 0; i < o1.length; i++) {
            if (!isEqual(o1[i], o2[i])) {
              return false;
            }
          }
          return true;
        }
      default:
        return o1 === o2;
    }
  }
}
