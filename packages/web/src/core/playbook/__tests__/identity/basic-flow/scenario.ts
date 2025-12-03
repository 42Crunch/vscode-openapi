import { Scanconf } from "@xliic/scanconf";

const basicCredential: Scanconf.Credential = {
  type: "basic",
  default: "basic",
  credentials: {
    basic: {
      credential: "{{$vault}}",
      description: "basic security",
    },
  },
};

const createPost: Scanconf.Operation = {
  operationId: "createPost",
  request: {
    operationId: "createPost",
    auth: ["basic"],
    request: {
      type: "42c",
      details: {
        operationId: "createPost",
        method: "POST",
        url: "{{host}}/basic-flow/post",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
        requestBody: {
          mode: "json",
          json: {
            content: "pszihgyrdnjxrplqbvnugtovgeomlnsd",
          },
        },
      },
    },
    defaultResponse: "201",
    responses: {
      "201": {
        expectations: {
          httpStatus: 201,
        },
      },
      "403": {
        expectations: {
          httpStatus: 403,
        },
      },
    },
  },
  scenarios: [
    {
      key: "happy.path",
      requests: [
        {
          fuzzing: true,
          $ref: "#/operations/createPost/request",
        },
      ],
      fuzzing: true,
    },
  ],
};

const deletePost: Scanconf.Operation = {
  operationId: "deletePost",
  request: {
    operationId: "deletePost",
    auth: ["basic"],
    request: {
      type: "42c",
      details: {
        operationId: "deletePost",
        method: "DELETE",
        url: "{{host}}/basic-flow/post/{id}",
        paths: [
          {
            key: "id",
            value: "{{id}}",
          },
        ],
      },
    },
    defaultResponse: "200",
    responses: {
      "200": {
        expectations: {
          httpStatus: 200,
        },
      },
      "403": {
        expectations: {
          httpStatus: 403,
        },
      },
      "404": {
        expectations: {
          httpStatus: 404,
        },
      },
    },
  },
  scenarios: [
    {
      key: "happy.path",
      requests: [
        {
          $ref: "#/operations/createPost/request",
          responses: {
            "201": {
              expectations: {
                httpStatus: 201,
              },
              variableAssignments: {
                id: {
                  from: "response",
                  in: "body",
                  contentType: "json",
                  path: {
                    type: "jsonPointer",
                    value: "/id",
                  },
                },
              },
            },
          },
        },
        {
          fuzzing: true,
          $ref: "#/operations/deletePost/request",
        },
      ],
      fuzzing: true,
    },
  ],
};

const getPost: Scanconf.Operation = {
  operationId: "getPost",
  request: {
    operationId: "getPost",
    auth: ["basic"],
    request: {
      type: "42c",
      details: {
        operationId: "getPost",
        method: "GET",
        url: "{{host}}/basic-flow/post/{id}",
        paths: [
          {
            key: "id",
            value: "{{id}}",
          },
        ],
      },
    },
    defaultResponse: "200",
    responses: {
      "200": {
        expectations: {
          httpStatus: 200,
        },
      },
      "403": {
        expectations: {
          httpStatus: 403,
        },
      },
      "404": {
        expectations: {
          httpStatus: 404,
        },
      },
    },
  },
  scenarios: [
    {
      key: "happy.path",
      requests: [
        {
          $ref: "#/operations/createPost/request",
          responses: {
            "201": {
              expectations: {
                httpStatus: 201,
              },
              variableAssignments: {
                id: {
                  from: "response",
                  in: "body",
                  contentType: "json",
                  path: {
                    type: "jsonPointer",
                    value: "/id",
                  },
                },
              },
            },
          },
        },
        {
          fuzzing: true,
          $ref: "#/operations/getPost/request",
        },
        {
          $ref: "#/operations/deletePost/request",
        },
      ],
      fuzzing: true,
    },
  ],
};

const getPosts: Scanconf.Operation = {
  operationId: "getPosts",
  request: {
    operationId: "getPosts",
    auth: ["basic"],
    request: {
      type: "42c",
      details: {
        operationId: "getPosts",
        method: "GET",
        url: "{{host}}/basic-flow/posts",
      },
    },
    defaultResponse: "200",
    responses: {
      "200": {
        expectations: {
          httpStatus: 200,
        },
      },
      "403": {
        expectations: {
          httpStatus: 403,
        },
      },
    },
  },
  scenarios: [
    {
      key: "happy.path",
      requests: [
        {
          fuzzing: true,
          $ref: "#/operations/getPosts/request",
        },
      ],
      fuzzing: true,
    },
  ],
};

const file: Scanconf.ConfigurationFileBundle = {
  version: "2.0.0",

  operations: {
    createPost,
    deletePost,
    getPost,
    getPosts,
  },
  authenticationDetails: [
    {
      basic: basicCredential,
    },
  ],
};

export default file;
