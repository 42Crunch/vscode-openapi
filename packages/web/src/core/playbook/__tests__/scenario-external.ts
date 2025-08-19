import { Scanconf } from "@xliic/scanconf";

export default function scenario(port: number): Scanconf.ConfigurationFileBundle {
  const userinfo: Scanconf.Operation = {
    operationId: "userinfo",
    scenarios: [
      {
        key: "happy.path",
        requests: [
          {
            $ref: "#/requests/external",
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
          url: `http://localhost:${port}/api/user/info`,
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

  const requests: Record<string, Scanconf.RequestFile> = {
    external: {
      request: {
        type: "42c",
        details: {
          url: `http://localhost:${port}/api/register`,
          method: "POST",
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
      external: true,
    },
  };

  return {
    version: "2.0.0",
    operations: {
      userinfo,
    },
    requests,
    authenticationDetails: [],
    environments: {
      default: {
        variables: {},
      },
    },
  };
}
