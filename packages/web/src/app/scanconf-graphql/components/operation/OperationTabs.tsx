import { useFormContext, useWatch } from "react-hook-form";

import {
  OpenApi30,
  Swagger,
  isOpenapi,
  HttpMethod,
  deref,
  BundledSwaggerOrOasSpec,
  OpenApi3,
  BundledOasSpec,
  OpenApi31,
} from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { TabContainer } from "../../../../new-components/Tabs";
import ParameterGroup from "../parameters/ParameterGroup";
import Environment from "../environment/Environment";
import {
  // getParameters as getOasParameters,
  // getSecurity as getOasSecurity,
  hasSecurityRequirements as hasOasSecurityRequirements,
} from "../scenario/util";

import { getParameters as getOasParameters } from "../../../../util";

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
  config,
  path,
  method,
  credentials,
  settings,
  availableVariables,
}: {
  config: any;
  credentials: Playbook.Credentials | undefined;
  settings?: JSX.Element;
  path: string;
  method: HttpMethod;
  availableVariables: string[];
}) {
  const { getValues } = useFormContext();

  const isBodyPresent = getValues("body") !== undefined;

  const tabs = makeOasTabs(config, credentials, path, method, availableVariables, isBodyPresent);

  return <TabContainer tabs={tabs} />;
}

function makeOasTabs(
  config: any,
  credentials: Playbook.Credentials | undefined,
  path: string,
  method: HttpMethod,
  availableVariables: string[],
  isBodyPresent: boolean
) {
  // const parameters = getOasParameters(oas, path, method);
  // const operation = OpenApi3.getOperation(oas, path, method);
  // const requestBody = deref<OpenApi30.RequestBody | OpenApi31.RequestBody>(
  //   oas,
  //   operation?.requestBody
  // );
  // const scanconfParameters = useWatch({ name: "parameters" });

  return [
    {
      id: "body",
      title: "Body Details",
      content: <RequestBody variables={availableVariables} />,
      disabled: false, //requestBody === undefined || !isBodyPresent,
    },
    // {
    //   id: "security",
    //   title: "Auth",
    //   content: (
    //     <Security
    //       oas={oas}
    //       credentials={credentials}
    //       security={OpenApi3.getSecurity(oas, path, method)}
    //     />
    //   ),
    //   disabled: !hasOasSecurityRequirements(oas, path, method),
    // },
    // {
    //   id: "path",
    //   title: "Path",
    //   content: (
    //     <ParameterGroup
    //       oas={oas}
    //       group={parameters.path}
    //       name={"parameters.path"}
    //       placeholder="Add new parameter"
    //       variables={availableVariables}
    //     />
    //   ),
    //   disabled: hasNoParameters(parameters.path, scanconfParameters.path),
    // },
    // {
    //   id: "query",
    //   title: "Query",
    //   content: (
    //     <ParameterGroup
    //       oas={oas}
    //       group={parameters.query}
    //       name={"parameters.query"}
    //       placeholder="Add new parameter"
    //       variables={availableVariables}
    //     />
    //   ),
    //   disabled: hasNoParameters(parameters.query, scanconfParameters.query),
    // },
    // {
    //   id: "header",
    //   title: "Header",
    //   content: (
    //     <ParameterGroup
    //       oas={oas}
    //       group={parameters.header}
    //       name={"parameters.header"}
    //       placeholder="Add new header"
    //       variables={availableVariables}
    //       allowUnknown
    //     />
    //   ),
    // },
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
