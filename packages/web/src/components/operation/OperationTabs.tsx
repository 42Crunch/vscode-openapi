import * as Tabs from "@radix-ui/react-tabs";

import { useEffect, useState } from "react";
import { HttpMethod } from "@xliic/common/http";
import { deref } from "@xliic/common/ref";

import { TabList, TabButton } from "../../components/Tabs";

import RequestBody from "./RequestBody";

import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";
import {
  BundledOpenApiSpec,
  OasRequestBody,
  getOperation as getOasOperation,
} from "@xliic/common/oas30";
import { BundledSwaggerSpec, getOperation as getSwaggerOperation } from "@xliic/common/swagger";

import {
  getParameters as getOasParameters,
  getSecurity as getOasSecurity,
  hasSecurityRequirements as hasOasSecurityRequirements,
} from "../../util";
import {
  getParameters as getSwaggerParameters,
  hasSecurityRequirements as hasSwaggerSecurityRequirements,
  getSecurity as getSwaggerSecurity,
} from "../../util-swagger";

import ParameterGroup from "../parameters/ParameterGroup";
import Security from "./Security";
import RequestBodySwagger from "./RequestBodySwagger";
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
  const tabs = isOpenapi(oas) ? makeOasTabs(oas, path, method) : makeSwaggerTabs(oas, path, method);

  if (settings) {
    tabs.push({
      id: "settings",
      title: "Settings",
      content: settings,
      enabled: true,
    });
  }

  const activeId = tabs.filter((tab) => tab.enabled)?.[0]?.id;

  if (activeId === undefined) {
    return null;
  }

  const [activeTab, setActiveTab] = useState(activeId);

  // TODO resets tabs on any change, perhaps should do it when switching beween operation os files?
  useEffect(() => {
    setActiveTab(tabs.filter((tab) => tab.enabled)?.[0].id);
  }, [oas]);

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <TabList>
        {tabs
          .filter((tab) => tab.enabled)
          .map((tab) => (
            <TabButton key={tab.id} value={tab.id}>
              {tab.title}
            </TabButton>
          ))}
      </TabList>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id}>
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

function makeOasTabs(oas: BundledOpenApiSpec, path: string, method: HttpMethod) {
  const parameters = getOasParameters(oas, path, method);
  const operation = getOasOperation(oas, path, method);
  const requestBody = deref<OasRequestBody>(oas, operation?.requestBody);

  return [
    {
      id: "body",
      title: "Body",
      content: <RequestBody oas={oas} requestBody={requestBody} />,
      enabled: requestBody !== undefined,
    },
    {
      id: "security",
      title: "Auth",
      content: <Security oas={oas} security={getOasSecurity(oas, path, method)} />,
      enabled: hasOasSecurityRequirements(oas, path, method),
    },
    {
      id: "path",
      title: "Path",
      content: <ParameterGroup oas={oas} group={parameters.path} />,
      enabled: hasParameters(parameters.path),
    },
    {
      id: "query",
      title: "Query",
      content: <ParameterGroup oas={oas} group={parameters.query} />,
      enabled: hasParameters(parameters.query),
    },
    {
      id: "header",
      title: "Header",
      content: <ParameterGroup oas={oas} group={parameters.header} />,
      enabled: hasParameters(parameters.header),
    },
    {
      id: "cookie",
      title: "Cookie",
      content: <ParameterGroup oas={oas} group={parameters.cookie} />,
      enabled: hasParameters(parameters.cookie),
    },
  ];
}

function makeSwaggerTabs(oas: BundledSwaggerSpec, path: string, method: HttpMethod) {
  const parameters = getSwaggerParameters(oas, path, method);

  return [
    {
      id: "body",
      title: "Body",
      content: <RequestBodySwagger oas={oas} group={parameters.body} />,
      enabled: hasParameters(parameters.body),
    },
    {
      id: "security",
      title: "Auth",
      content: <SwaggerSecurity oas={oas} security={getSwaggerSecurity(oas, path, method)} />,
      enabled: hasSwaggerSecurityRequirements(oas, path, method),
    },
    {
      id: "formData",
      title: "Form",
      content: <ParameterGroup oas={oas} group={parameters.formData} />,
      enabled: hasParameters(parameters.formData),
    },
    {
      id: "path",
      title: "Path",
      content: <ParameterGroup oas={oas} group={parameters.path} />,
      enabled: hasParameters(parameters.path),
    },
    {
      id: "query",
      title: "Query",
      content: <ParameterGroup oas={oas} group={parameters.query} />,
      enabled: hasParameters(parameters.query),
    },
    {
      id: "header",
      title: "Header",
      content: <ParameterGroup oas={oas} group={parameters.header} />,
      enabled: hasParameters(parameters.header),
    },
  ];
}

function hasParameters(parameters?: Record<string, unknown>) {
  return parameters !== undefined && Object.keys(parameters).length > 0;
}
