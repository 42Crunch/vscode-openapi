import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useDrag } from "react-dnd";
import styled from "styled-components";
import { PlaybookEnvStack } from "../../../core/playbook/playbook-env";
import { GripVertical, TrashCan, TriangleExclamation } from "../../../icons";
import Form from "../../../new-components/Form";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { TabContainer } from "../../../new-components/Tabs";
import Input from "../../../new-components/fields/Input";
import Switch from "../../../new-components/fields/Switch";
import ResponseProcessing from "../components/operation/ResponseProcessing";
import Environment from "../components/scenario/Environment";
import { OperationResult } from "../components/scenario/types";
import { unwrapPlaybookStage, wrapPlaybookStage } from "../components/scenario/util";
import MissingVariables from "./MissingVariables";
import Card from "./components/Card";

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
}: {
  stage: playbook.StageReference;
  location: playbook.StageLocation;
  oas: BundledSwaggerOrOasSpec;
  result?: OperationResult;
  saveStage: (stage: playbook.StageReference) => void;
  removeStage: () => void;
  fuzzing?: boolean;
  operations: playbook.PlaybookBundle["operations"];
  requests: playbook.PlaybookBundle["requests"];
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "stage",
    item: { location },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const refTargetMissing =
    (stage.ref.type === "operation" ? operations[stage.ref.id] : requests[stage.ref.id]) ===
    undefined;

  const variables = getVariableNamesFromEnvStack(result?.variablesReplaced?.stack || []);
  const missingVariablesCount = Array.from(
    new Set(result?.variablesReplaced?.missing || [])
  ).length;

  return (
    <Form
      data={stage}
      saveData={saveStage}
      wrapFormData={wrapPlaybookStage}
      unwrapFormData={unwrapPlaybookStage}
    >
      <Container
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: "move",
        }}
      >
        <Card>
          <Description>
            <span>{stage.ref.id}</span>
            <Icons onClick={(e) => e.stopPropagation()}>
              {missingVariablesCount > 0 && (
                <Error>
                  <TriangleExclamation />
                </Error>
              )}
              {refTargetMissing && (
                <Error>
                  <TriangleExclamation />
                  {`${stage.ref.type}/${stage.ref.id} is missing`}
                </Error>
              )}
              <ExpectedResponse>
                <span>Expected Response</span>
                <Input name="expectedResponse" />
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
                <MenuItem onSelect={removeStage}>
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
                content: <Environment name="environment" variables={variables} />,
              },
              {
                id: "responses",
                title: "Response Processing",
                content: <ResponseProcessing />,
              },
              {
                id: "missing-variables",
                title: "Missing Variables",
                counter: missingVariablesCount,
                content: <MissingVariables missing={result?.variablesReplaced?.missing} />,
                disabled: missingVariablesCount === 0,
                counterKind: "error",
              },
            ]}
          />
        </Card>
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

const Container = styled.div`
  background-color: var(${ThemeColorVariables.background});
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
    flex: 1;
    font-weight: 600;
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
  > input {
    width: 30px;
    background: transparent;
    border: 1px solid var(${ThemeColorVariables.border});
    padding: 2px;
    color: var(${ThemeColorVariables.foreground});
    &::placeholder {
      color: var(${ThemeColorVariables.inputPlaceholderForeground});
    }
    &:focus {
      outline: none;
    }
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

const Error = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 2px;
  border-radius: 4px;
  color: var(${ThemeColorVariables.errorForeground});
  background-color: var(${ThemeColorVariables.errorBackground});
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
  }
`;
