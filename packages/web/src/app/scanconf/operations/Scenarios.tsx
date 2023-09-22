import * as Tabs from "@radix-ui/react-tabs";
import * as playbook from "@xliic/common/playbook";
import styled from "styled-components";
import { TabButton, TabList } from "../../../components/Tabs";
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
    <Tabs.Root value={`${scenarioId}`} onValueChange={(value) => setScenarioId(parseInt(value))}>
      <TabList>
        {scenarios.map((scenario, index) => (
          <TabButton key={index} value={`${index}`}>
            {scenario.key}
          </TabButton>
        ))}
      </TabList>
      {scenarios.map((scenario, scenarioIndex) => (
        <TabsContent key={scenarioIndex} value={`${scenarioIndex}`}>
          <Scenario
            oas={oas}
            stages={scenario.requests}
            container={{ container: "operationScenarios", operationId, scenarioIndex }}
            executionResult={result?.operationScenarios}
            saveStage={saveStage}
            moveStage={moveStage}
            removeStage={removeStage}
          />
          <AddRequest
            operationIds={operationIds}
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
