import type { Scanconf } from "@xliic/scanconf";

const basicCredential: Scanconf.Credential = {
  type: "basic",
  default: "User",
  credentials: {
    User: {
      credential: "{{$vault}}",
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
        url: "http://localhost:8888/api/basic/info",
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
    userinfoBasic,
  },
  authenticationDetails: [
    {
      basic: basicCredential,
    },
  ],
};

export default file;
