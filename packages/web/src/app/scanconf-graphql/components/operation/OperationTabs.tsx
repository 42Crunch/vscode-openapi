import { useFormContext } from "react-hook-form";

import { HttpMethod } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { TabContainer } from "../../../../new-components/Tabs";
import ParameterGroup from "../parameters/ParameterGroup";

import RequestBody from "./RequestBody";

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
  return [
    {
      id: "body",
      title: "Body Details",
      content: <RequestBody variables={availableVariables} />,
      disabled: false,
    },
    {
      id: "header",
      title: "Header",
      content: <ParameterGroup name={"parameters.header"} />,
    },
  ];
}
