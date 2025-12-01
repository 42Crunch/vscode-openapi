import { Scanconf } from "@xliic/scanconf";

const basicCredential: Scanconf.Credential = {
  type: "basic",
  default: "User",
  credentials: {
    User: {
      credential: "user1:password123",
    },
  },
};

const userinfoToken: Scanconf.Operation = {
  operationId: "getPosts",
  scenarios: [
    {
      key: "happy.path",
      requests: [
        {
          $ref: "#/operations/getPosts/request",
        },
      ],
    },
  ],
  request: {
    auth: ["basic"],
    request: {
      type: "42c",
      details: {
        operationId: "getPosts",
        method: "GET",
        url: "http://localhost:8888/basic-flow/posts",
      },
    },
    defaultResponse: "200",
    responses: {
      "200": {
        expectations: {
          httpStatus: 200,
        },
      },
    },
  },
};

const file: Scanconf.ConfigurationFileBundle = {
  version: "2.0.0",
  operations: {
    userinfoToken,
  },
  authenticationDetails: [
    {
      basic: basicCredential,
    },
  ],
};

export default file;
