import {
  OpenApi30,
  Swagger,
  BundledSwaggerOrOasSpec,
  HttpMethod,
  isOpenapi,
  deref,
} from "@xliic/openapi";

import { Tab, TabContainer } from "../../new-components/Tabs";
import {
  getParameters as getOasParameters,
  getSecurity as getOasSecurity,
  hasSecurityRequirements as hasOasSecurityRequirements,
} from "../../util";
import {
  getParameters as getSwaggerParameters,
  getSecurity as getSwaggerSecurity,
  hasSecurityRequirements as hasSwaggerSecurityRequirements,
} from "../../util-swagger";
import ParameterGroup from "../parameters/ParameterGroup";
import RequestBody from "./RequestBody";
import RequestBodySwagger from "./RequestBodySwagger";
import Security from "./Security";
import SwaggerSecurity from "./SwaggerSecurity";

export default function OperationTabs({
  oas,
  path,
  method,
  settings,
}: {
  oas: BundledSwaggerOrOasSpec;
  settings?: JSX.Element;
  path: string;
  method: HttpMethod;
}) {
  const tabs: Tab[] = isOpenapi(oas)
    ? makeOasTabs(oas, path, method)
    : makeSwaggerTabs(oas, path, method);

  if (settings) {
    tabs.push({
      id: "settings",
      title: "Settings",
      content: settings,
    });
  }

  return <TabContainer tabs={tabs} />;
}

function makeOasTabs(oas: OpenApi30.BundledSpec, path: string, method: HttpMethod) {
  const parameters = getOasParameters(oas, path, method);
  const operation = OpenApi30.getOperation(oas, path, method);
  const requestBody = deref<OpenApi30.RequestBody>(oas, operation?.requestBody);

  return [
    {
      id: "body",
      title: "Body",
      content: <RequestBody oas={oas} requestBody={requestBody} />,
      disabled: requestBody === undefined,
    },
    {
      id: "security",
      title: "Auth",
      content: <Security oas={oas} security={getOasSecurity(oas, path, method)} />,
      disabled: !hasOasSecurityRequirements(oas, path, method),
    },
    {
      id: "path",
      title: "Path",
      content: <ParameterGroup oas={oas} group={parameters.path} />,
      disabled: !hasParameters(parameters.path),
    },
    {
      id: "query",
      title: "Query",
      content: <ParameterGroup oas={oas} group={parameters.query} />,
      disabled: !hasParameters(parameters.query),
    },
    {
      id: "header",
      title: "Header",
      content: <ParameterGroup oas={oas} group={parameters.header} />,
      disabled: !hasParameters(parameters.header),
    },
    {
      id: "cookie",
      title: "Cookie",
      content: <ParameterGroup oas={oas} group={parameters.cookie} />,
      disabled: !hasParameters(parameters.cookie),
    },
  ];
}

function makeSwaggerTabs(oas: Swagger.BundledSpec, path: string, method: HttpMethod) {
  const parameters = getSwaggerParameters(oas, path, method);

  return [
    {
      id: "body",
      title: "Body",
      content: <RequestBodySwagger oas={oas} group={parameters.body} />,
      disabled: !hasParameters(parameters.body),
    },
    {
      id: "security",
      title: "Auth",
      content: <SwaggerSecurity oas={oas} security={getSwaggerSecurity(oas, path, method)} />,
      disabled: !hasSwaggerSecurityRequirements(oas, path, method),
    },
    {
      id: "formData",
      title: "Form",
      content: <ParameterGroup oas={oas} group={parameters.formData} />,
      disabled: !hasParameters(parameters.formData),
    },
    {
      id: "path",
      title: "Path",
      content: <ParameterGroup oas={oas} group={parameters.path} />,
      disabled: !hasParameters(parameters.path),
    },
    {
      id: "query",
      title: "Query",
      content: <ParameterGroup oas={oas} group={parameters.query} />,
      disabled: !hasParameters(parameters.query),
    },
    {
      id: "header",
      title: "Header",
      content: <ParameterGroup oas={oas} group={parameters.header} />,
      disabled: !hasParameters(parameters.header),
    },
  ];
}

function hasParameters(parameters?: Record<string, unknown>) {
  return parameters !== undefined && Object.keys(parameters).length > 0;
}
