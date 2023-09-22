import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useDrag } from "react-dnd";
import styled from "styled-components";
import { OperationResult } from "../components/scenario/types";
import { EllipsisVertical, GripVertical, TrashCan, TriangleExclamation } from "../../../icons";
import Form from "../components/Form";
import StageReferenceTabs from "./StageReferenceTabs";
import Card from "./components/Card";
import { unwrapPlaybookStage, wrapPlaybookStage } from "../components/scenario/util";

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
              <Grab>
                <GripVertical />
              </Grab>
              <Menu remove={removeStage} />
            </Icons>
          </Description>
          <StageReferenceTabs oas={oas} result={result} />
        </Card>
      </Container>
    </Form>
  );
}

function Menu({ remove }: { remove: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton>
          <EllipsisVertical />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onSelect={remove}>
            <TrashCan />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const IconButton = styled.button`
  background-color: transparent;
  opacity: 0;
  color: transparent;
  border: none;
  margin: 0;
  padding: 0;
  &[data-state="open"] {
    opacity: 1;
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const DropdownMenuContent = styled(DropdownMenu.Content)`
  margin: 4px;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  border: 1px solid var(${ThemeColorVariables.dropdownBorder});
  min-width: 100px;
  padding: 4px;
`;

const DropdownMenuItem = styled(DropdownMenu.Item)`
  margin: 2px;
  color: var(${ThemeColorVariables.dropdownForeground});
  display: flex;
  gap: 8px;
  align-items: center;
  &[data-highlighted] {
    background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
    color: var(${ThemeColorVariables.listActiveSelectionForeground});
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Container = styled.div`
  background-color: var(${ThemeColorVariables.background});
  &:hover {
    div,
    button {
      opacity: 1;
    }
  }
`;

export const Description = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-weight: 600;
  &:hover {
    div {
      opacity: 1;
    }
`;

const Grab = styled.div`
  cursor: grab;
  opacity: 0;
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
