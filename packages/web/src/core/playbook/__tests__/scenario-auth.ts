import * as scan from "../scanconfig";

const credential1: scan.Credential = {
  type: "apiKey",
  default: "User",
  credentials: {
    User: {
      requests: [{ $ref: "#/operations/register/request" }],
      credential: "{{token}}",
    },
  },
};

const register: scan.Operation = {
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
            name: "foo{{$random}}",
            pass: "1afNp3FXC",
            user: "foo{{$random}}@company.co.uk",
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

const userinfo: scan.Operation = {
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
        headers: [
          {
            key: "x-access-token",
            value: "{{token}}",
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
    },
  },
};

const file: scan.ConfigurationFileBundle = {
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
