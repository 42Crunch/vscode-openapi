import * as Tabs from "@radix-ui/react-tabs";
import * as playbook from "@xliic/common/playbook";
import styled from "styled-components";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { TabButton, TabList } from "../../../new-components/Tabs";
import { findResult } from "../playbook-execution-handler";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Scenario from "./Scenario";
import AddRequest from "./components/AddRequest";
import * as localActions from "./slice";

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
        },
      })
    );
  };

  return (
    <Tabs.Root value={`${scenarioId}`} onValueChange={(value) => setScenarioId(parseInt(value))}>
      <TabList>
        {scenarios.map((scenario, index) => (
          <TabButton key={index} value={`${index}`}>
            {scenario.key}
          </TabButton>
        ))}
        <Controls>
          <Menu>
            <MenuItem onSelect={() => undefined}>Delete</MenuItem>
          </Menu>
        </Controls>
      </TabList>
      {scenarios.map((scenario, scenarioIndex) => (
        <TabsContent key={scenarioIndex} value={`${scenarioIndex}`}>
          <Scenario
            oas={oas}
            stages={scenario.requests as playbook.StageReference[]}
            container={{ container: "operationScenarios", operationId, scenarioIndex }}
            executionResult={findResult(result, "operationScenarios")}
            saveStage={saveStage}
            moveStage={moveStage}
            removeStage={removeStage}
            fuzzing
          />
          <AddRequest
            operationIds={operationIds}
            requestIds={requestIds}
            onSelect={(selected) =>
              addStage({ container: "operationScenarios", operationId, scenarioIndex }, selected)
            }
          />
        </TabsContent>
      ))}
    </Tabs.Root>
  );
}

const TabsContent = styled(Tabs.Content)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
`;

const Controls = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;
