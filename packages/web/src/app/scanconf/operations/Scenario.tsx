import React from "react";
import { useDrop } from "react-dnd";
import styled from "styled-components";

import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import { PlaybookResult } from "../components/scenario/types";
import Stage from "./Stage";

export default function Scenario({
  oas,
  stages,
  container,
  executionResult,
  saveStage,
  removeStage,
  moveStage,
  fuzzing,
  operations,
  requests,
  goToRequest,
}: {
  oas: BundledSwaggerOrOasSpec;
  stages: Playbook.StageReference[];
  container: Playbook.StageContainer;
  executionResult?: PlaybookResult;
  saveStage: (location: Playbook.StageLocation, stage: Playbook.StageReference) => void;
  removeStage: (location: Playbook.StageLocation) => void;
  moveStage: (location: Playbook.StageLocation, to: number) => void;
  fuzzing?: boolean;
  operations: Playbook.Bundle["operations"];
  requests: Playbook.Bundle["requests"];
  goToRequest: (req: Playbook.RequestRef) => void;
}) {
  const save = (location: Playbook.StageLocation) => (stage: Playbook.StageReference) =>
    saveStage(location, stage);
  const remove = (location: Playbook.StageLocation) => () => removeStage(location);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "stage",
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  if (stages.length === 0) {
    return null;
  }

  return (
    <Container ref={drop}>
      {stages.map((stage, stageIndex) => {
        const location = { ...container, stageIndex };
        return (
          <React.Fragment key={`stage-${stageIndex}-${stage.ref.type}-${stage.ref.id}`}>
            {isOver && <StageDropTarget moveStage={moveStage} destinationIndex={stageIndex} />}
            <Stage
              oas={oas}
              stage={stage as Playbook.StageReference}
              result={executionResult?.results?.[stageIndex]}
              saveStage={save(location)}
              removeStage={remove(location)}
              goToRequest={goToRequest}
              location={location}
              fuzzing={fuzzing}
              operations={operations}
              requests={requests}
              stageIndex={stageIndex}
            />
          </React.Fragment>
        );
      })}
    </Container>
  );
}

function StageDropTarget({
  destinationIndex,
  moveStage,
}: {
  destinationIndex: number;
  moveStage: (from: Playbook.StageLocation, to: number) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "stage",
    drop: (item: any) => moveStage(item.location, destinationIndex),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  return <StageDropArea ref={drop} isOver={isOver}></StageDropArea>;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StageDropArea = styled.div`
  display: flex;
  border: 16px solid var(${ThemeColorVariables.border});
  opacity: 0.5;
  cursor: pointer;
  ${({ isOver }: { isOver: boolean }) => isOver && "opacity: 1;"}
`;
