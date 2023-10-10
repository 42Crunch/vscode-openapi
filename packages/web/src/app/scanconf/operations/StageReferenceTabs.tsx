import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { Tab, TabContainer } from "../../../new-components/Tabs";
import ResponseProcessing from "../components/operation/ResponseProcessing";
import Environment from "../components/scenario/Environment";
import { OperationResult } from "../components/scenario/types";
import MissingVariables from "./MissingVariables";
import StageReferenceSettings from "./StageReferenceSettings";

export default function StageReferenceTabs({
  oas,
  result,
  variables,
}: {
  oas: BundledSwaggerOrOasSpec;
  variables: string[];
  result?: OperationResult;
}) {
  const missingVariablesCount = Array.from(
    new Set(result?.variablesReplaced?.missing || [])
  ).length;

  const tabs: Tab[] = [
    {
      id: "environment",
      title: "Environment",
      content: <Environment name="environment" variables={variables} />,
    },
    {
      id: "responses",
      title: "Response Processing",
      content: <ResponseProcessing oas={oas} />,
    },
    {
      id: "settings",
      title: "Settings",
      content: <StageReferenceSettings />,
    },
    {
      id: "missing-variables",
      title: "Missing Variables",
      counter: missingVariablesCount,
      content: <MissingVariables missing={result?.variablesReplaced?.missing} />,
      disabled: missingVariablesCount === 0,
      counterKind: "error",
    },
  ];

  return <TabContainer tabs={tabs} />;
}
