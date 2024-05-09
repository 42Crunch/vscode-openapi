import { useFormContext, useWatch } from "react-hook-form";

import {
  OpenApi30,
  Swagger,
  BundledSwaggerOrOasSpec,
  isOpenapi,
  HttpMethod,
  deref,
} from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { TabContainer } from "../../../../new-components/Tabs";
import ParameterGroup from "../parameters/ParameterGroup";
import Environment from "../environment/Environment";
import {
  getParameters as getOasParameters,
  getSecurity as getOasSecurity,
  hasSecurityRequirements as hasOasSecurityRequirements,
} from "../scenario/util";
import {
  getParameters as getSwaggerParameters,
  getSecurity as getSwaggerSecurity,
  hasSecurityRequirements as hasSwaggerSecurityRequirements,
} from "../scenario/util-swagger";
import Security from "../security/Security";
import RequestBody from "./RequestBody";
import RequestBodySwagger from "./RequestBodySwagger";
import ResponseProcessing from "./ResponseProcessing";

export default function OperationTabs({
  oas,
  path,
  method,
  credentials,
  settings,
  availableVariables,
}: {
  oas: BundledSwaggerOrOasSpec;
  credentials: Playbook.Credentials;
  settings?: JSX.Element;
  path: string;
  method: HttpMethod;
  availableVariables: string[];
}) {
  const { getValues } = useFormContext();

  const isBodyPresent = getValues("body") !== undefined;

  const tabs = isOpenapi(oas)
    ? makeOasTabs(oas, credentials, path, method, availableVariables, isBodyPresent)
    : makeSwaggerTabs(oas, credentials, path, method, availableVariables, isBodyPresent);

  return <TabContainer tabs={tabs} />;
}

function makeOasTabs(
  oas: OpenApi30.BundledSpec,
  credentials: Playbook.Credentials,
  path: string,
  method: HttpMethod,
  availableVariables: string[],
  isBodyPresent: boolean
) {
  const parameters = getOasParameters(oas, path, method);
  const operation = OpenApi30.getOperation(oas, path, method);
  const requestBody = deref<OpenApi30.RequestBody>(oas, operation?.requestBody);
  const scanconfParameters = useWatch({ name: "parameters" });

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
      content: (
        <ParameterGroup
          oas={oas}
          group={parameters.path}
          name={"parameters.path"}
          placeholder="Add new parameter"
          variables={availableVariables}
        />
      ),
      disabled: hasNoParameters(parameters.path, scanconfParameters.path),
    },
    {
      id: "query",
      title: "Query",
      content: (
        <ParameterGroup
          oas={oas}
          group={parameters.query}
          name={"parameters.query"}
          placeholder="Add new parameter"
          variables={availableVariables}
        />
      ),
      disabled: hasNoParameters(parameters.query, scanconfParameters.query),
    },
    {
      id: "header",
      title: "Header",
      content: (
        <ParameterGroup
          oas={oas}
          group={parameters.header}
          name={"parameters.header"}
          placeholder="Add new header"
          variables={availableVariables}
          allowUnknown
        />
      ),
    },
    {
      id: "cookie",
      title: "Cookie",
      content: (
        <ParameterGroup
          oas={oas}
          group={parameters.cookie}
          name={"parameters.cookie"}
          placeholder="Add new parameter"
          variables={availableVariables}
        />
      ),
      disabled: hasNoParameters(parameters.cookie, scanconfParameters.cookie),
    },
    {
      id: "environment",
      title: "Environment",
      content: <Environment name="environment" variables={availableVariables} />,
    },
    {
      id: "responses",
      title: "Response processing",
      content: <ResponseProcessing />,
    },
  ];
}

function makeSwaggerTabs(
  oas: Swagger.BundledSpec,
  credentials: Playbook.Credentials,
  path: string,
  method: HttpMethod,
  availableVariables: string[],
  isBodyPresent: boolean
) {
  const parameters = getSwaggerParameters(oas, path, method);
  const scanconfParameters = useWatch({ name: "parameters" });

  return [
    {
      id: "body",
      title: "Body",
      content: (
        <RequestBodySwagger oas={oas} group={parameters.body} variables={availableVariables} />
      ),
      disabled: hasNoParameters(parameters.body, scanconfParameters.body) || !isBodyPresent,
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
    // multipart form-data are not supported for now
    // {
    //   id: "formData",
    //   title: "Form",
    //   content: (
    //     <ParameterGroup
    //       oas={oas}
    //       group={parameters.formData}
    //       name={"parameters.formData"}
    //       placeholder="Add new entry"
    //       variables={availableVariables}
    //     />
    //   ),
    //   disabled: hasNoParameters(parameters.formData) || !isBodyPresent,
    // },
    {
      id: "path",
      title: "Path",
      content: (
        <ParameterGroup
          oas={oas}
          group={parameters.path}
          name={"parameters.path"}
          placeholder="Add new parameter"
          variables={availableVariables}
        />
      ),
      disabled: hasNoParameters(parameters.path, scanconfParameters.path),
    },
    {
      id: "query",
      title: "Query",
      content: (
        <ParameterGroup
          oas={oas}
          group={parameters.query}
          name={"parameters.query"}
          placeholder="Add new parameter"
          variables={availableVariables}
        />
      ),
      disabled: hasNoParameters(parameters.query, scanconfParameters.query),
    },
    {
      id: "header",
      title: "Header",
      content: (
        <ParameterGroup
          oas={oas}
          group={parameters.header}
          name={"parameters.header"}
          placeholder="Add new header"
          variables={availableVariables}
          allowUnknown
        />
      ),
    },
    {
      id: "environment",
      title: "Environment",
      content: <Environment name="environment" variables={availableVariables} />,
    },
    {
      id: "responses",
      title: "Response processing",
      content: <ResponseProcessing />,
    },
  ];
}

function hasNoParameters(
  parameters: Record<string, unknown> | undefined,
  scanconfParameters: any[]
) {
  return (
    (parameters === undefined || Object.keys(parameters).length === 0) &&
    (scanconfParameters === undefined || scanconfParameters.length === 0)
  );
}
