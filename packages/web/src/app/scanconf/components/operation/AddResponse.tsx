import styled from "styled-components";
import * as Dialog from "@radix-ui/react-dialog";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useForm, FormProvider } from "react-hook-form";
import Input from "../Input";
import { useState } from "react";

export default function AddResponse({ add }: { add: any }) {
  const methods = useForm({
    defaultValues: { code: "200" },
    mode: "onChange",
  });

  const [open, setOpen] = useState(false);

  const onSubmit = (data: any) => {
    add({
      key: data.code,
      value: {
        expectations: {
          httpStatus: data.code,
        },
        variableAssignments: [],
      },
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Add</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Overlay />
        <DialogContent>
          <FormProvider {...methods}>
            <form
              onSubmit={(event) => {
                methods.handleSubmit(onSubmit)(event);
                event.preventDefault();
                setOpen(false);
              }}
            >
              <Dialog.Title className="DialogTitle">Add response processing</Dialog.Title>
              <Dialog.Description className="DialogDescription">
                Add response processing section for a specified response code
              </Dialog.Description>
              <Input label="Response code" name="code" />
              <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
                <Button type="submit">Add</Button>
                <Dialog.Close asChild>
                  <ButtonSecondary>Cancel</ButtonSecondary>
                </Dialog.Close>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const Button = styled.button`
  margin: 4px;
  padding: 4px 8px;
  background-color: var(${ThemeColorVariables.buttonBackground});
  color: var(${ThemeColorVariables.buttonForeground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  &:hover {
    background-color: var(${ThemeColorVariables.buttonHoverBackground});
  }
`;

const ButtonSecondary = styled.button`
  margin: 4px;
  padding: 4px 8px;
  background-color: var(${ThemeColorVariables.buttonSecondaryBackground});
  color: var(${ThemeColorVariables.buttonSecondaryForeground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  &:hover {
    background-color: var(${ThemeColorVariables.buttonSecondaryHoverBackground});
  }
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
