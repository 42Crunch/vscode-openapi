import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import React from "react";
import { useDrop } from "react-dnd";
import styled from "styled-components";
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
}: {
  oas: BundledSwaggerOrOasSpec;
  stages: playbook.StageReference[];
  container: playbook.StageContainer;
  executionResult?: PlaybookResult;
  saveStage: (location: playbook.StageLocation, stage: playbook.StageReference) => void;
  removeStage: (location: playbook.StageLocation) => void;
  moveStage: (location: playbook.StageLocation, to: number) => void;
}) {
  const save = (location: playbook.StageLocation) => (stage: playbook.StageReference) =>
    saveStage(location, stage);
  const remove = (location: playbook.StageLocation) => () => removeStage(location);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "stage",
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <Container ref={drop}>
      {stages.map((stage, stageIndex) => {
        const location = { ...container, stageIndex };
        return (
          <React.Fragment key={`stage-${stageIndex}-${stage.ref.type}-${stage.ref.id}`}>
            {isOver && <StageDropTarget moveStage={moveStage} destinationIndex={stageIndex} />}
            <Stage
              oas={oas}
              stage={stage as playbook.StageReference}
              result={executionResult?.results?.[stageIndex]}
              saveStage={save(location)}
              removeStage={remove(location)}
              location={location}
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
  moveStage: (from: playbook.StageLocation, to: number) => void;
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
