import * as playbook from "@xliic/common/playbook";
import { useState } from "react";
import styled from "styled-components";
import CollapsibleSection from "../components/CollapsibleSection";
import Scenario from "../operations/Scenario";
import AddRequest from "../operations/components/AddRequest";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";

export default function Global() {
  const dispatch = useAppDispatch();

  const { oas, playbook } = useAppSelector((state) => state.scanconf);

  const removeStage = (location: playbook.StageLocation) => dispatch(actions.removeStage(location));

  const saveStage = (location: playbook.StageLocation, stage: playbook.StageReference) =>
    dispatch(actions.saveOperationReference({ location, reference: stage }));

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

  const [isBeforeOpen, setBeforeOpen] = useState(true);
  const [isAfterOpen, setAfterOpen] = useState(true);
  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

  return (
    <Container>
      <CollapsibleSection
        isOpen={isBeforeOpen}
        onClick={(e) => {
          setBeforeOpen(!isBeforeOpen);
        }}
        title="Before"
        count={playbook?.before?.length}
      >
        <Content>
          <Scenario
            oas={oas}
            stages={playbook.before as playbook.StageReference[]}
            container={{ container: "globalBefore" }}
            executionResult={undefined}
            saveStage={saveStage}
            moveStage={moveStage}
            removeStage={removeStage}
            operations={playbook.operations}
            requests={playbook.requests}
          />
          <AddRequest
            operationIds={operationIds}
            requestIds={requestIds}
            onSelect={(selected) => addStage({ container: "globalBefore" }, selected)}
          />
        </Content>
      </CollapsibleSection>
      <CollapsibleSection
        isOpen={isAfterOpen}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAfterOpen(!isAfterOpen);
        }}
        title="After"
        count={playbook.after?.length}
      >
        <Content>
          <Scenario
            oas={oas}
            stages={playbook.after as playbook.StageReference[]}
            container={{ container: "globalAfter" }}
            executionResult={undefined}
            saveStage={saveStage}
            removeStage={removeStage}
            moveStage={moveStage}
            operations={playbook.operations}
            requests={playbook.requests}
          />
          <AddRequest
            operationIds={operationIds}
            requestIds={requestIds}
            onSelect={(selected) => addStage({ container: "globalAfter" }, selected)}
          />
        </Content>
      </CollapsibleSection>
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
