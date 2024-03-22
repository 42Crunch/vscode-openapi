import * as Dialog from "@radix-ui/react-dialog";
import { HttpMethod, HttpMethods } from "@xliic/openapi";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import styled from "styled-components";
import Button from "../../../components/Button";
import ButtonSecondary from "../../../components/ButtonSecondary";
import Input from "../../../components/Input";
import { Plus } from "../../../icons";
import Select from "../components/Select";

export default function AddExternalRequestDialog({
  onAddExternalRequest,
}: {
  onAddExternalRequest: (
    id: string,
    method: HttpMethod,
    url: string,
    mode: "json" | "urlencoded"
  ) => void;
}) {
  const methods = useForm({
    defaultValues: {
      id: "",
      method: "post",
      url: "http://localhost:8080/",
      mode: "json",
    },
    mode: "onChange",
  });

  const httpMethods = HttpMethods.map((method) => ({ value: method, label: method.toUpperCase() }));

  const [open, setOpen] = useState(false);

  const onSubmit = (data: any) => {
    onAddExternalRequest(data.id, data.method, data.url, data.mode);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (open) {
          methods.reset();
        }
      }}
    >
      <Dialog.Trigger asChild>
        <AddRequestButton>
          <Plus />
        </AddRequestButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Overlay />
        <DialogContent>
          <FormProvider {...methods}>
            <Form
              onSubmit={(event) => {
                methods.handleSubmit(onSubmit)(event);
                event.preventDefault();
                setOpen(false);
              }}
            >
              <Dialog.Title>New External Request</Dialog.Title>
              <Dialog.Description>Add new external request</Dialog.Description>
              <Input label="Request ID" name="id" />
              <Input label="URL" name="url" />
              <Select label="Method" name="method" options={httpMethods} />
              <Select
                label="Content type"
                name="mode"
                options={[
                  { value: "json", label: "application/json" },
                  { value: "urlencoded", label: "application/x-www-form-urlencoded" },
                ]}
              />
              <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end", gap: 4 }}>
                <Button type="submit">Add</Button>
                <Dialog.Close asChild>
                  <ButtonSecondary>Cancel</ButtonSecondary>
                </Dialog.Close>
              </div>
            </Form>
          </FormProvider>
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
const Form = styled.form`
  margin: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
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

const AddRequestButton = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
    &:hover {
      fill: var(${ThemeColorVariables.linkActiveForeground});
    }
  }
`;
