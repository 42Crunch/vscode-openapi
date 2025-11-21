import { FieldValues } from "react-hook-form";
import * as z from "zod";

import { Playbook } from "@xliic/scanconf";

import Input from "../../../components/Input";
import FormDialog from "../../../new-components/FormDialog";
import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../../../core/playbook/variables";

export default function NewCredentialValueDialog({
  onAddCredentialValue,
  existing,
  isOpen,
  setOpen,
}: {
  existing: string[];
  onAddCredentialValue: (name: string, value: Playbook.CredentialMethod) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}) {
  const defaultValues: FormSchema = { name: "", value: "" };

  const onSubmit = (values: FormSchema) => {
    onAddCredentialValue(values.name, { credential: values.value, requests: [] });
  };

  const schema = formSchema.extend({
    name: formSchema.shape.name.refine((value) => !existing.includes(value), {
      message: "Already exists",
    }),
  });

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={setOpen}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      schema={schema}
    >
      <ValueForm />
    </FormDialog>
  );
}

function ValueForm() {
  return (
    <>
      <Input label="Credential name" name="name" />
      <Input label="Credential value" name="value" />
    </>
  );
}

const formSchema = z.object({
  name: z.string().regex(ENV_VAR_NAME_REGEX(), {
    message: ENV_VAR_NAME_REGEX_MESSAGE,
  }),
  value: z.string().min(1),
});

type FormSchema = z.infer<typeof formSchema>;
