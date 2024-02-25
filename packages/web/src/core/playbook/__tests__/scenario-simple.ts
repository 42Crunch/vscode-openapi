import { Scanconf } from "@xliic/scanconf";

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
          username: {
            from: "request",
            in: "body",
            contentType: "json",
            path: {
              type: "jsonPointer",
              value: "/user",
            },
          },
          password: {
            from: "request",
            in: "body",
            contentType: "json",
            path: {
              type: "jsonPointer",
              value: "/pass",
            },
          },
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
          $ref: "#/operations/register/request",
        },
        {
          $ref: "#/operations/userinfo/request",
        },
      ],
    },
  ],
  request: {
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

const file: Scanconf.ConfigurationFileBundle = {
  version: "2.0.0",
  operations: {
    register,
    userinfo,
  },
  authenticationDetails: [],
};

export default file;
