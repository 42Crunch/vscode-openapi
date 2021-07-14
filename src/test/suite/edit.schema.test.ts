import assert from "assert";
import { generateSchema, generateOneOfSchema } from "../../audit/schema";

suite("Schema Generate Test Suite", () => {
  test("Test 1", () => {
    const input = [
      {
        id: 2,
        name: "An ice sculpture",
        price: 12.5,
        tags: ["cold", "ice"],
        dimensions: {
          length: 7.0,
          width: 12.0,
          height: 9.5,
        },
        warehouseLocation: {
          latitude: -78.75,
          longitude: 20.4,
        },
      },
      {
        id: 3,
        name: "A blue mouse",
        price: 25.5,
        misc: [1, true, "ice", 1.0, [1, 2, 3], { a: "1", b: "2" }],
        dimensions: {
          length: 3.1,
          width: 1.0,
          height: 1.0,
        },
        warehouseLocation: {
          latitude: 54.4,
          longitude: -32.7,
        },
      },
    ];

    const output = {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "integer",
          },
          name: {
            type: "string",
          },
          price: {
            type: "number",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
          },
          dimensions: {
            type: "object",
            properties: {
              length: {
                type: ["integer", "number"],
              },
              width: {
                type: "integer",
              },
              height: {
                type: ["number", "integer"],
              },
            },
            required: ["length", "width", "height"],
          },
          warehouseLocation: {
            type: "object",
            properties: {
              latitude: {
                type: "number",
              },
              longitude: {
                type: "number",
              },
            },
            required: ["latitude", "longitude"],
          },
          misc: {
            type: "array",
            items: {
              oneOf: [
                {
                  type: "integer",
                },
                {
                  type: "boolean",
                },
                {
                  type: "string",
                },
                {
                  type: "array",
                  items: {
                    type: "integer",
                  },
                },
                {
                  type: "object",
                  properties: {
                    a: {
                      type: "string",
                    },
                    b: {
                      type: "string",
                    },
                  },
                  required: ["a", "b"],
                },
              ],
            },
          },
        },
        required: ["id", "name", "price", "dimensions", "warehouseLocation"],
      },
    };

    const result: string = JSON.stringify(generateSchema(input));
    assert.ok(result.indexOf("undefined") === -1);
    assert.equal(result, JSON.stringify(output));
  });

  test("Test 2", () => {
    const input = {
      paths: {
        "/products": {
          get: {
            summary: "Product Types",
            description: "The Products endpoint",
            parameters: [
              {
                name: "latitude",
                in: "query",
                description: "Latitude component of location.",
                required: true,
                type: "number",
                format: "double",
              },
              {
                name: "longitude",
                in: "query",
                description: "Longitude component of location.",
                required: true,
                type: "number",
                format: "double",
              },
            ],
            tags: ["Products", "abc"],
            responses: {
              "200": {
                description: "An array of products",
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/definitions/Product",
                  },
                },
              },
              default: {
                description: "Unexpected error",
                schema: {
                  $ref: "#/definitions/Error",
                },
              },
            },
          },
        },
      },
    };

    const output = {
      type: "object",
      properties: {
        paths: {
          type: "object",
          properties: {
            "/products": {
              type: "object",
              properties: {
                get: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                    },
                    description: {
                      type: "string",
                    },
                    parameters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                          in: {
                            type: "string",
                          },
                          description: {
                            type: "string",
                          },
                          required: {
                            type: "boolean",
                          },
                          type: {
                            type: "string",
                          },
                          format: {
                            type: "string",
                          },
                        },
                        required: ["name", "in", "description", "required", "type", "format"],
                      },
                    },
                    tags: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                    responses: {
                      type: "object",
                      properties: {
                        "200": {
                          type: "object",
                          properties: {
                            description: {
                              type: "string",
                            },
                            schema: {
                              type: "object",
                              properties: {
                                type: {
                                  type: "string",
                                },
                                items: {
                                  type: "object",
                                  properties: {
                                    $ref: {
                                      type: "string",
                                    },
                                  },
                                  required: ["$ref"],
                                },
                              },
                              required: ["type", "items"],
                            },
                          },
                          required: ["description", "schema"],
                        },
                        default: {
                          type: "object",
                          properties: {
                            description: {
                              type: "string",
                            },
                            schema: {
                              type: "object",
                              properties: {
                                $ref: {
                                  type: "string",
                                },
                              },
                              required: ["$ref"],
                            },
                          },
                          required: ["description", "schema"],
                        },
                      },
                      required: ["200", "default"],
                    },
                  },
                  required: ["summary", "description", "parameters", "tags", "responses"],
                },
              },
              required: ["get"],
            },
          },
          required: ["/products"],
        },
      },
      required: ["paths"],
    };

    const result: string = JSON.stringify(generateSchema(input));
    assert.ok(result.indexOf("undefined") === -1);
    assert.equal(result, JSON.stringify(output));
  });

  test("Test 3", () => {
    const input = [
      [
        [1, 2],
        ["a", "b"],
      ],
    ];

    const output = {
      type: "array",
      items: {
        type: "array",
        items: [
          {
            type: "array",
            items: {
              type: "integer",
            },
          },
          {
            type: "array",
            items: {
              type: "string",
            },
          },
        ],
      },
    };

    const result: string = JSON.stringify(generateSchema(input));
    assert.ok(result.indexOf("undefined") === -1);
    assert.equal(result, JSON.stringify(output));
  });

  test("Test 4 (generateOneOfSchema)", () => {
    const inputs = [{ a: "hello" }, { b: 12 }, [{ c: true }, { d: 13 }], { b: 14 }];

    const output = {
      oneOf: [
        {
          type: "object",
          properties: {
            a: {
              type: "string",
            },
          },
          required: ["a"],
        },
        {
          type: "object",
          properties: {
            b: {
              type: "integer",
            },
          },
          required: ["b"],
        },
        {
          type: "array",
          items: {
            type: "object",
            properties: {
              c: {
                type: "boolean",
              },
              d: {
                type: "integer",
              },
            },
            required: [],
          },
        },
      ],
    };

    const result: string = JSON.stringify(generateOneOfSchema(inputs));
    assert.ok(result.indexOf("undefined") === -1);
    assert.equal(result, JSON.stringify(output));
  });

  test("Test 5 (generateOneOfSchema)", () => {
    const inputs = [{ a: "hello" }];

    const output = {
      type: "object",
      properties: {
        a: {
          type: "string",
        },
      },
      required: ["a"],
    };

    const result: string = JSON.stringify(generateOneOfSchema(inputs));
    assert.ok(result.indexOf("undefined") === -1);
    assert.equal(result, JSON.stringify(output));
  });

  test("Test 6 (generateOneOfSchema)", () => {
    const inputs = [{ a: "hello" }];

    inputs.push(inputs[0]);
    inputs.push(inputs[0]);
    inputs.push(inputs[0]);

    const output = {
      type: "object",
      properties: {
        a: {
          type: "string",
        },
      },
      required: ["a"],
    };

    const result: string = JSON.stringify(generateOneOfSchema(inputs));
    assert.ok(result.indexOf("undefined") === -1);
    assert.equal(result, JSON.stringify(output));
  });
});
