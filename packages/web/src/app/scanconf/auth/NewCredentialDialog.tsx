import styled from "styled-components";
import * as Dialog from "@radix-ui/react-dialog";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useForm, FormProvider } from "react-hook-form";
import * as playbook from "@xliic/common/playbook";
import Input from "../../../components/Input";
import { useState } from "react";
import Select from "../../../components/Select";
import Button from "../../../components/Button";
import ButtonSecondary from "../../../components/ButtonSecondary";

export default function NewCredentialDialog({
  onAddCredential,
}: {
  onAddCredential: (id: string, credential: playbook.Credential) => void;
}) {
  const methods = useForm({
    defaultValues: {
      id: "",
      type: "apiKey",
      in: "header",
      name: "",
      description: "",
      credentialName: "",
      credentialValue: "",
    },
    mode: "onChange",
  });

  const [open, setOpen] = useState(false);

  const onSubmit = (data: any) => {
    onAddCredential(data.id, {
      type: data.type,
      default: data.credentialName,
      in: data.in,
      name: data.name,
      description: data.description,
      methods: {
        [data.credentialName]: {
          credential: data.credentialValue,
          requests: [],
          description: "",
        },
      },
    });
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
        <Button style={{ width: "100%" }}>Add new credential</Button>
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
              <Dialog.Title>Add credential</Dialog.Title>
              <Dialog.Description>Add new credential</Dialog.Description>
              <Input label="ID" name="id" />
              <Select
                label="Type"
                name="type"
                options={[
                  { value: "basic", label: "basic" },
                  { value: "bearer", label: "bearer" },
                  { value: "apiKey", label: "apiKey" },
                  { value: "oauth2", label: "oauth2" },
                  { value: "openIdConnect", label: "openIdConnect" },
                ]}
              />
              <Select
                label="Location"
                name="in"
                options={[
                  { value: "header", label: "header" },
                  { value: "query", label: "query" },
                  { value: "cookie", label: "cookie" },
                ]}
              />
              <Input label="Name" name="name" />
              <Input label="Description" name="description" />
              <Input label="Credential Name" name="credentialName" />
              <Input label="Credential Value" name="credentialValue" />

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
