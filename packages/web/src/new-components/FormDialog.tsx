import styled from "styled-components";
import * as Dialog from "@radix-ui/react-dialog";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useForm, FormProvider, FieldValues } from "react-hook-form";
import { useState } from "react";
import Button from "./Button";
import ButtonSecondary from "./ButtonSecondary";

export default function FormDialog({
  onSubmit,
  defaultValues,
  trigger,
  title,
  description,
  contents,
}: {
  trigger: JSX.Element;
  contents: JSX.Element;
  defaultValues: FieldValues;
  onSubmit: (values: FieldValues) => void;
  title?: string;
  description?: string;
}) {
  const methods = useForm({
    defaultValues,
    mode: "onChange",
  });

  const [open, setOpen] = useState(false);

  //const onSubmit = (data: any) => {
  // onAddCredential(data.id, {
  //   type: data.type,
  //   default: data.credentialName,
  //   in: data.in,
  //   name: data.name,
  //   description: data.description,
  //   methods: {
  //     [data.credentialName]: {
  //       credential: data.credentialValue,
  //       requests: [],
  //       description: "",
  //     },
  //   },
  // });
  //};

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
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
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
              {title && <Dialog.Title>{title}</Dialog.Title>}
              {description && <Dialog.Description>{description}</Dialog.Description>}
              {contents}
              <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end", gap: 4 }}>
                <Button type="submit">Ok</Button>
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
