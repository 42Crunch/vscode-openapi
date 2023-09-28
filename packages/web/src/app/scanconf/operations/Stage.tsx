import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useDrag } from "react-dnd";
import styled from "styled-components";
import { GripVertical, TrashCan, TriangleExclamation } from "../../../icons";
import Form from "../../../new-components/Form";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { OperationResult } from "../components/scenario/types";
import { unwrapPlaybookStage, wrapPlaybookStage } from "../components/scenario/util";
import StageReferenceTabs from "./StageReferenceTabs";
import Card from "./components/Card";

export default function Stage({
  stage,
  oas,
  result,
  saveStage,
  removeStage,
  location,
}: {
  stage: playbook.StageReference;
  location: playbook.StageLocation;
  oas: BundledSwaggerOrOasSpec;
  result?: OperationResult;
  saveStage: (stage: playbook.StageReference) => void;
  removeStage: () => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "stage",
    item: { location },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const missingLenghth = result?.variablesReplaced?.missing?.length;
  const hasMissingVariables = missingLenghth !== undefined && missingLenghth > 0;

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
            {stage.ref.id}
            <Icons>
              {hasMissingVariables && (
                <Error>
                  <TriangleExclamation />
                </Error>
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
          <StageReferenceTabs oas={oas} result={result} />
        </Card>
      </Container>
    </Form>
  );
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
  font-weight: 600;
`;

const Grab = styled.div`
  cursor: grab;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Error = styled.div`
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
  }
`;

const Icons = styled.div`
  flex: 1;
  display: flex;
  justify-content: end;
  gap: 4px;
`;
