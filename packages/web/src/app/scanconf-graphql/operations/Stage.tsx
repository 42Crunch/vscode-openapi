import { useDrag } from "react-dnd";
import styled from "styled-components";
import * as Tooltip from "@radix-ui/react-tooltip";

import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import { DynamicVariableNames } from "../../../core/playbook/builtin-variables";
import { PlaybookEnvStack } from "../../../core/playbook/playbook-env";
import { GripVertical, Link, TrashCan, TriangleExclamation } from "../../../icons";
import Form from "../../../new-components/Form";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { TabContainer } from "../../../new-components/Tabs";
import Switch from "../../../new-components/fields/Switch";
import ResponseProcessing from "../components/operation/ResponseProcessing";
import Environment from "../components/environment/Environment";
import { OperationResult } from "../components/scenario/types";
import { unwrapPlaybookStage, wrapPlaybookStage } from "../components/scenario/util";
import CollapsibleCard from "../../../new-components/CollapsibleCard";
import DownshiftSelect from "../../../new-components/fields/DownshiftSelect";
import VariableUsed from "../components/scenario/VariableUsed";

export default function Stage({
  stage,
  oas,
  result,
  saveStage,
  removeStage,
  location,
  fuzzing,
  operations,
  requests,
  goToRequest,
  stageIndex,
}: {
  stage: Playbook.StageReference;
  location: Playbook.StageLocation;
  oas: BundledSwaggerOrOasSpec;
  result?: OperationResult;
  saveStage: (stage: Playbook.StageReference) => void;
  removeStage: () => void;
  fuzzing?: boolean;
  operations: Playbook.Bundle["operations"];
  requests: Playbook.Bundle["requests"];
  goToRequest: (req: Playbook.RequestRef) => void;
  stageIndex: number;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "stage",
    item: { location },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const refTarget =
    stage.ref.type === "operation" ? operations[stage.ref.id] : requests[stage.ref.id];

  const defaultResponseCode = getDefaultResponseCode(refTarget);

  const responseCodes = getResponseCodes(refTarget);

  const responseCodeOptions = [
    ...responseCodes
      .filter((value) => value !== "default")
      .map((value) => ({ label: value, value: value })),
  ];

  const availableVariables = [
    ...DynamicVariableNames,
    ...getVariableNamesFromEnvStack(result?.variablesReplaced?.stack || []),
  ];

  const missingVariables = Array.from(new Set(result?.variablesReplaced?.missing || [])).map(
    (e) => e.name
  );

  return (
    <Form
      data={stage}
      saveData={saveStage}
      wrapFormData={wrapPlaybookStage}
      unwrapFormData={unwrapPlaybookStage}
    >
      <Container>
        <Position>{stageIndex + 1}</Position>
        <StageContainer
          ref={drag}
          style={{
            opacity: isDragging ? 0.5 : 1,
            cursor: isDragging ? "move" : "auto",
          }}
        >
          <CollapsibleCard>
            <Description>
              <span>
                {stage.ref.id}
                <Link
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToRequest(stage.ref);
                  }}
                />
              </span>
              <Icons onClick={(e) => e.stopPropagation()}>
                {missingVariables.length > 0 && (
                  <StageError
                    message="Unset variables"
                    description={`There are unset variables in this step of the scenario. You can set their values in the 'Environment' section of the step, or in the 'Response processing' section of the previous steps.`}
                  />
                )}
                {refTarget === undefined && (
                  <StageError
                    message={`${stage.ref.type}/${stage.ref.id} is missing`}
                    description="Target of a reference is missing"
                  />
                )}
                <ExpectedResponse>
                  <span>Expected Response</span>
                  <DownshiftSelect
                    name="expectedResponse"
                    options={responseCodeOptions}
                    placeholder={defaultResponseCode}
                  />
                </ExpectedResponse>
                {fuzzing && (
                  <Fuzzing>
                    <span>Fuzzing</span>
                    <Switch name="fuzzing" />
                  </Fuzzing>
                )}
                <Grab className="grab">
                  <GripVertical />
                </Grab>
                <Menu>
                  <MenuItem onClick={(e) => e.stopPropagation()} onSelect={removeStage}>
                    <TrashCan />
                    Delete
                  </MenuItem>
                </Menu>
              </Icons>
            </Description>
            <TabContainer
              tabs={[
                {
                  id: "environment",
                  title: "Environment",
                  content: (
                    <Environment
                      name="environment"
                      variables={availableVariables}
                      missing={missingVariables}
                    />
                  ),
                  counter: missingVariables.length,
                  counterKind: "error",
                },
                {
                  id: "responses",
                  title: "Response processing",
                  content: <ResponseProcessing editable responseCodes={responseCodes} />,
                },
                {
                  id: "variables",
                  title: "Context",
                  content: (
                    <VariableUsed
                      currentStep={stageIndex}
                      missing={result?.variablesReplaced?.missing}
                      found={result?.variablesReplaced?.found}
                    />
                  ),
                },
              ]}
            />
          </CollapsibleCard>
        </StageContainer>
      </Container>
    </Form>
  );
}

function getVariableNamesFromEnvStack(env: PlaybookEnvStack): string[] {
  const variables: string[] = [];
  for (const entry of env) {
    for (const name of Object.keys(entry.env)) {
      if (!variables.includes(name)) {
        variables.push(name);
      }
    }
  }
  variables.sort();
  return variables;
}

function getResponseCodes(
  target: Playbook.Operation | Playbook.StageContent | Playbook.ExternalStageContent | undefined
): string[] {
  if (target !== undefined) {
    const responses = "scenarios" in target ? target.request.responses : target.responses;
    const codes = Object.keys(responses || {}).map((key) => key);
    return codes;
  }
  return [];
}

function getDefaultResponseCode(
  target: Playbook.Operation | Playbook.StageContent | Playbook.ExternalStageContent | undefined
): string | undefined {
  if (target !== undefined) {
    const stageContent = "scenarios" in target ? target.request : target;
    return stageContent.defaultResponse;
  }
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Position = styled.div`
  font-weight: 400;
  font-size: 12px;
  align-items: center;
  justify-content: center;
  width: 18px;
`;

const StageContainer = styled.div`
  background-color: var(${ThemeColorVariables.background});
  flex: 1;
  .grab,
  .menu {
    opacity: 0;
  }
  &:hover {
    .grab,
    .menu {
      opacity: 1;
    }
  }
`;

export const Description = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  > span {
    > svg {
      fill: var(${ThemeColorVariables.linkForeground});
    }
    flex: 1;
    font-weight: 600;
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
`;

const Icons = styled.div`
  cursor: auto;
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 10px;
`;

const ExpectedResponse = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  > div {
    width: 60px;
    border: 1px solid var(${ThemeColorVariables.border});
  }
`;

const Fuzzing = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
`;

const Grab = styled.div`
  cursor: grab;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

function StageError({ message, description }: { message: string; description: string }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <MissingVariableMessage>
            <TriangleExclamation /> <span>{message}</span>
          </MissingVariableMessage>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

const MissingVariableMessage = styled.div`
  cursor: help;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  color: var(${ThemeColorVariables.foreground});
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const TooltipContent = styled(Tooltip.Content)`
  max-width: 400px;
  color: var(${ThemeColorVariables.notificationsForeground});
  background-color: var(${ThemeColorVariables.notificationsBackground});
  border: 1px solid var(${ThemeColorVariables.notificationsBorder});
  border-radius: 4px;
  padding: 4px 8px;
  margin-right: 16px;
`;
