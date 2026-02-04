import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import Button from "../../../components/Button";
import ButtonSecondary from "../../../components/ButtonSecondary";
import DownshiftCombo from "../../../new-components/DownshiftCombo";

export default function NewScenarioDialog({
  onAddScenario,
  operations,
}: {
  operations: Record<string, Playbook.Operation>;
  onAddScenario: (operationId: string) => void;
}) {
  const available = Object.entries(operations)
    .filter(([operationId, operation]) => !operation.customized)
    .map(([operationId, operation]) => operationId);

  const [open, setOpen] = useState(false);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null | undefined>(
    undefined
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <Dialog.Trigger asChild>
        <Button style={{ width: "100%" }}>New scenario</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Overlay />
        <DialogContent>
          <Contents>
            <Dialog.Title>New Scenario</Dialog.Title>
            <Dialog.Description>Add happy path scenario for an operation</Dialog.Description>
            <Border>
              <DownshiftCombo
                options={available}
                placeholder="Select operation"
                onSelectedItemChange={(item) => {
                  setSelectedOperationId(item);
                }}
              />
            </Border>
            <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end", gap: 4 }}>
              <Button
                onClick={() => {
                  if (
                    selectedOperationId !== null &&
                    selectedOperationId !== undefined &&
                    available.includes(selectedOperationId)
                  ) {
                    onAddScenario(selectedOperationId);
                    setOpen(false);
                  }
                }}
              >
                Add
              </Button>
              <Dialog.Close asChild>
                <ButtonSecondary>Cancel</ButtonSecondary>
              </Dialog.Close>
            </div>
          </Contents>
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const Contents = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Border = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
`;

const Overlay = styled(Dialog.Overlay)`
  background-color: var(${ThemeColorVariables.computedTwo});
  position: fixed;
  inset: 0;
`;

const DialogContent = styled(Dialog.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 450px;
  max-height: 85vh;
  padding: 25px;

  background-color: var(${ThemeColorVariables.background});
  color: var(${ThemeColorVariables.foreground});
  border-radius: 6px;
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
`;
