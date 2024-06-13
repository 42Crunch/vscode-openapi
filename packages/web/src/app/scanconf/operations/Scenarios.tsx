import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";

import { TabContainer } from "../../../new-components/Tabs";
import { findResult } from "../playbook-execution-handler";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Scenario from "./Scenario";
import AddRequest from "./AddRequest";
import * as localActions from "./slice";

export default function Scenarios({
  operationId,
  goToRequest,
}: {
  operationId: string;
  goToRequest: (req: Playbook.RequestRef) => void;
}) {
  const dispatch = useAppDispatch();
  const { playbook, oas } = useAppSelector((state) => state.scanconf);
  const { scenarioId, mockResult } = useAppSelector((state) => state.operations);
  const scenarios = playbook.operations[operationId].scenarios;
  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

  const setScenarioId = (scenarioId: number) => dispatch(localActions.setScenarioId(scenarioId));

  const saveStage = (location: Playbook.StageLocation, stage: Playbook.StageReference) =>
    dispatch(actions.saveOperationReference({ location, reference: stage }));
  const removeStage = (location: Playbook.StageLocation) => dispatch(actions.removeStage(location));

  const moveStage = (location: Playbook.StageLocation, to: number) =>
    dispatch(actions.moveStage({ location, to }));

  const addStage = (container: Playbook.StageContainer, ref: Playbook.RequestRef) => {
    dispatch(
      actions.addStage({
        container,
        stage: {
          ref,
        },
      })
    );
  };

  const tabs = scenarios.map((scenario, scenarioIndex) => ({
    id: `${scenarioIndex}`,
    title: scenario.key,
    /* not implemented
    menu: (
      <Menu>
        <MenuItem onSelect={() => undefined}>Delete</MenuItem>
      </Menu>
    ),
    */
    content: (
      <Container>
        <Scenario
          oas={oas}
          stages={scenario.requests as Playbook.StageReference[]}
          container={{ container: "operationScenarios", operationId, scenarioIndex }}
          executionResult={findResult(mockResult, "operationScenarios")}
          saveStage={saveStage}
          moveStage={moveStage}
          removeStage={removeStage}
          operations={playbook.operations}
          requests={playbook.requests}
          goToRequest={goToRequest}
          fuzzing
        />
        <PickOperation>
          <AddRequest
            operationIds={operationIds}
            requestIds={requestIds}
            onSelect={(selected) =>
              addStage({ container: "operationScenarios", operationId, scenarioIndex }, selected)
            }
          />
        </PickOperation>
      </Container>
    ),
  }));

  return (
    <TabContainer
      activeTab={`${scenarioId}`}
      setActiveTab={(tab: string) => setScenarioId(parseInt(tab))}
      tabs={tabs}
    />
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const PickOperation = styled.div`
  margin-left: 18px;
`;
