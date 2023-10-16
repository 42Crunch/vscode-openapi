import * as Tabs from "@radix-ui/react-tabs";
import * as playbook from "@xliic/common/playbook";
import styled from "styled-components";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { TabButton, TabList } from "../../../new-components/Tabs";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Scenario from "./Scenario";
import AddRequest from "./components/AddRequest";
import * as localActions from "./slice";
import { ThemeColorVariables } from "@xliic/common/theme";
import CollapsibleSection from "../components/CollapsibleSection";
import { Plus } from "../../../icons";

export default function Scenarios({ operationId }: { operationId: string }) {
  const { playbook, oas } = useAppSelector((state) => state.scanconf);
  const { scenarioId, mockResult: result } = useAppSelector((state) => state.operations);
  const scenarios = playbook.operations[operationId].scenarios;
  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

  const dispatch = useAppDispatch();

  const setScenarioId = (scenarioId: number) => dispatch(localActions.setScenarioId(scenarioId));

  const saveStage = (location: playbook.StageLocation, stage: playbook.StageReference) =>
    dispatch(actions.saveOperationReference({ location, reference: stage }));
  const removeStage = (location: playbook.StageLocation) => dispatch(actions.removeStage(location));

  const moveStage = (location: playbook.StageLocation, to: number) =>
    dispatch(actions.moveStage({ location, to }));

  const addStage = (container: playbook.StageContainer, ref: playbook.RequestRef) => {
    dispatch(
      actions.addStage({
        container,
        stage: {
          ref,
          credentialSetIndex: 0,
        },
      })
    );
  };

  return (
    <Container>
      {scenarios.map((scenario, scenarioIndex) => (
        <CollapsibleSection
          isOpen={true}
          title={<div>{scenario.key}</div>}
          menu={
            <>
              <AddRequestButton>
                <Plus />
              </AddRequestButton>
              <Menu>
                <MenuItem onSelect={() => undefined}>Delete</MenuItem>
              </Menu>
            </>
          }
        >
          <Content>
            <Scenario
              oas={oas}
              stages={scenario.requests as playbook.StageReference[]}
              container={{ container: "operationScenarios", operationId, scenarioIndex }}
              executionResult={result?.operationScenarios}
              saveStage={saveStage}
              moveStage={moveStage}
              removeStage={removeStage}
            />
            <AddRequest
              operationIds={operationIds}
              requestIds={requestIds}
              onSelect={(selected) =>
                addStage({ container: "operationScenarios", operationId, scenarioIndex }, selected)
              }
            />
          </Content>
        </CollapsibleSection>
      ))}
    </Container>
  );
}

const Container = styled.div``;
const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AddRequestButton = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
    &:hover {
      fill: var(${ThemeColorVariables.linkActiveForeground});
    }
  }
`;
