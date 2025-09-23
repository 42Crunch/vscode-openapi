import { Scanconf } from "@xliic/scanconf";

const tokenCredential: Scanconf.Credential = {
  type: "apiKey",
  in: "header",
  default: "User",
  credentials: {
    User: {
      credential: "2760cf6a-d99f-4f8f-881c-3637713615c0",
    },
  },
};

const basicCredential: Scanconf.Credential = {
  type: "basic",
  default: "User",
  credentials: {
    User: {
      credential: "foo:bar",
    },
  },
};

const userinfoToken: Scanconf.Operation = {
  operationId: "userinfoToken",
  scenarios: [
    {
      key: "happy.path",
      requests: [
        {
          $ref: "#/operations/userinfoToken/request",
        },
      ],
    },
  ],
  request: {
    auth: ["token"],
    request: {
      type: "42c",
      details: {
        operationId: "userinfoToken",
        method: "GET",
        url: "http://localhost:8090/api/user/info-token",
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

const userinfoBasic: Scanconf.Operation = {
  operationId: "userinfoBasic",
  scenarios: [
    {
      key: "happy.path",
      requests: [
        {
          $ref: "#/operations/userinfoBasic/request",
        },
      ],
    },
  ],
  request: {
    auth: ["basic"],
    request: {
      type: "42c",
      details: {
        operationId: "userinfoBasic",
        method: "GET",
        url: "http://localhost:8090/api/user/info-basic",
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
    userinfoBasic,
  },
  authenticationDetails: [
    {
      token: tokenCredential,
      basic: basicCredential,
    },
  ],
};

export default file;
