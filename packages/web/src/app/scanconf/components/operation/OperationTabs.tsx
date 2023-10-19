import { HttpMethod } from "@xliic/common/http";
import { deref } from "@xliic/common/ref";

import { TabContainer } from "../../../../new-components/Tabs";

import RequestBody from "./RequestBody";

import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";
import {
  BundledOpenApiSpec,
  OasRequestBody,
  getOperation as getOasOperation,
} from "@xliic/common/oas30";
import { BundledSwaggerSpec } from "@xliic/common/swagger";

import {
  getParameters as getOasParameters,
  getSecurity as getOasSecurity,
  hasSecurityRequirements as hasOasSecurityRequirements,
} from "../scenario/util";
import {
  getParameters as getSwaggerParameters,
  hasSecurityRequirements as hasSwaggerSecurityRequirements,
  getSecurity as getSwaggerSecurity,
} from "../scenario/util-swagger";

import ParameterGroup from "../parameters/ParameterGroup";
import RequestBodySwagger from "./RequestBodySwagger";
import Environment from "../scenario/Environment";
import ResponseProcessing from "./ResponseProcessing";
import * as playbook from "@xliic/common/playbook";
import { useFormContext } from "react-hook-form";
import Security from "../security/Security";

export default function OperationTabs({
  oas,
  path,
  method,
  credentials,
  settings,
  availableVariables,
  requestVariables,
}: {
  oas: BundledSwaggerOrOasSpec;
  credentials: playbook.Credentials;
  settings?: JSX.Element;
  path: string;
  method: HttpMethod;
  availableVariables: string[];
  requestVariables: string[];
}) {
  const { getValues } = useFormContext();

  const isBodyPresent = getValues("body") !== undefined;

  const tabs = isOpenapi(oas)
    ? makeOasTabs(
        oas,
        credentials,
        path,
        method,
        availableVariables,
        requestVariables,
        isBodyPresent
      )
    : makeSwaggerTabs(
        oas,
        credentials,
        path,
        method,
        availableVariables,
        requestVariables,
        isBodyPresent
      );

  return <TabContainer tabs={tabs} />;
}

function makeOasTabs(
  oas: BundledOpenApiSpec,
  credentials: playbook.Credentials,
  path: string,
  method: HttpMethod,
  availableVariables: string[],
  requestVariables: string[],
  isBodyPresent: boolean
) {
  const parameters = getOasParameters(oas, path, method);
  const operation = getOasOperation(oas, path, method);
  const requestBody = deref<OasRequestBody>(oas, operation?.requestBody);

  return [
    {
      id: "body",
      title: "Body",
      content: <RequestBody oas={oas} requestBody={requestBody} variables={availableVariables} />,
      disabled: requestBody === undefined || !isBodyPresent,
    },
    {
      id: "security",
      title: "Auth",
      content: (
        <Security
          oas={oas}
          credentials={credentials}
          security={getOasSecurity(oas, path, method)}
        />
      ),
      disabled: !hasOasSecurityRequirements(oas, path, method),
    },
    {
      id: "path",
      title: "Path",
      content: <ParameterGroup oas={oas} group={parameters.path} />,
      disabled: hasNoParameters(parameters.path),
    },
    {
      id: "query",
      title: "Query",
      content: <ParameterGroup oas={oas} group={parameters.query} />,
      disabled: hasNoParameters(parameters.query),
    },
    {
      id: "header",
      title: "Header",
      content: <ParameterGroup oas={oas} group={parameters.header} />,
      disabled: hasNoParameters(parameters.header),
    },
    {
      id: "cookie",
      title: "Cookie",
      content: <ParameterGroup oas={oas} group={parameters.cookie} />,
      disabled: hasNoParameters(parameters.cookie),
    },
    {
      id: "environment",
      title: "Environment",
      content: (
        <Environment name="environment" variables={availableVariables} names={requestVariables} />
      ),
    },
    {
      id: "responses",
      title: "Response Processing",
      content: <ResponseProcessing />,
    },
  ];
}

function makeSwaggerTabs(
  oas: BundledSwaggerSpec,
  credentials: playbook.Credentials,
  path: string,
  method: HttpMethod,
  availableVariables: string[],
  requestVariables: string[],
  isBodyPresent: boolean
) {
  const parameters = getSwaggerParameters(oas, path, method);

  return [
    {
      id: "body",
      title: "Body",
      content: (
        <RequestBodySwagger oas={oas} group={parameters.body} variables={availableVariables} />
      ),
      disabled: hasNoParameters(parameters.body) || !isBodyPresent,
    },
    {
      id: "security",
      title: "Auth",
      content: (
        <Security
          oas={oas}
          credentials={credentials}
          security={getSwaggerSecurity(oas, path, method)}
        />
      ),
      disabled: !hasSwaggerSecurityRequirements(oas, path, method),
    },
    {
      id: "formData",
      title: "Form",
      content: <ParameterGroup oas={oas} group={parameters.formData} />,
      disabled: hasNoParameters(parameters.formData),
    },
    {
      id: "path",
      title: "Path",
      content: <ParameterGroup oas={oas} group={parameters.path} />,
      disabled: hasNoParameters(parameters.path),
    },
    {
      id: "query",
      title: "Query",
      content: <ParameterGroup oas={oas} group={parameters.query} />,
      disabled: hasNoParameters(parameters.query),
    },
    {
      id: "header",
      title: "Header",
      content: <ParameterGroup oas={oas} group={parameters.header} />,
      disabled: hasNoParameters(parameters.header),
    },
    {
      id: "environment",
      title: "Environment",
      content: (
        <Environment name="environment" variables={availableVariables} names={requestVariables} />
      ),
    },
    {
      id: "responses",
      title: "Response Processing",
      content: <ResponseProcessing />,
    },
  ];
}

function hasNoParameters(parameters?: Record<string, unknown>) {
  return parameters === undefined || Object.keys(parameters).length === 0;
}
