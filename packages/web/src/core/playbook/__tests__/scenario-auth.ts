import { Scanconf } from "@xliic/scanconf";

const credential1: Scanconf.Credential = {
  type: "apiKey",
  in: "header",
  default: "User",
  credentials: {
    User: {
      requests: [{ $ref: "#/operations/register/request" }],
      credential: "{{token}}",
    },
  },
};

const register: Scanconf.Operation = {
  operationId: "register",
  scenarios: [],
  request: {
    request: {
      type: "42c",
      details: {
        operationId: "register",
        method: "POST",
        url: "http://localhost:8090/api/register",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
        requestBody: {
          mode: "json",
          json: {
            account_balance: 9,
            is_admin: true,
            name: "foo{{$randomuint}}",
            pass: "1afNp3FXC",
            user: "foo{{$randomuint}}@company.co.uk",
          },
        },
      },
    },
    defaultResponse: "200",
    responses: {
      "200": {
        expectations: {
          httpStatus: 200,
        },
        variableAssignments: {
          token: {
            from: "response",
            in: "body",
            contentType: "json",
            path: {
              type: "jsonPointer",
              value: "/token",
            },
          },
        },
      },
    },
  },
};

const userinfo: Scanconf.Operation = {
  operationId: "userinfo",
  scenarios: [
    {
      key: "happy.path",
      requests: [
        {
          $ref: "#/operations/userinfo/request",
        },
      ],
    },
  ],
  request: {
    auth: ["access-token"],
    request: {
      type: "42c",
      details: {
        operationId: "userinfo",
        method: "GET",
        url: "http://localhost:8090/api/user/info",
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
    register,
    userinfo,
  },
  authenticationDetails: [
    {
      "access-token": credential1,
    },
  ],
};

export default file;
