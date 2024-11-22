import * as z from "zod";

import { Playbook } from "@xliic/scanconf";

import Button from "../../../components/Button";

import FormDialog from "../../../new-components/FormDialog";
import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../../../core/playbook/variables";
import NewCredentialForm from "./NewCredentialForm";

export default function NewCredentialDialog({
  onAddCredential,
  existing,
}: {
  onAddCredential: (id: string, credential: Playbook.Credential) => void;
  existing: string[];
}) {
  const defaultValues = {
    id: "",
    type: "apiKey",
    in: "header",
    name: "",
    description: "",
    credentialName: "",
    credentialValue: "",
  };

  const schema = z.object({
    id: z
      .string()
      .regex(ENV_VAR_NAME_REGEX(), {
        message: ENV_VAR_NAME_REGEX_MESSAGE,
      })
      .refine((value) => !existing.includes(value), {
        message: "Already exists",
      }),
    type: z.string(),
    in: z.string(),
    name: z.string(),
    description: z.string(),
    credentialName: z.string().regex(ENV_VAR_NAME_REGEX(), {
      message: ENV_VAR_NAME_REGEX_MESSAGE,
    }),
    credentialValue: z.string().min(1),
  });

  const onSubmit = (data: any) => {
    const methods = {
      [data.credentialName]: {
        credential: data.credentialValue,
        requests: [],
        description: "",
      },
    };

    onAddCredential(
      data.id,
      data.type === "bearer" || data.type === "basic"
        ? // skip name and in
          {
            type: data.type,
            default: data.credentialName,
            description: data.description,
            methods,
          }
        : {
            type: data.type,
            default: data.credentialName,
            in: data.in,
            name: data.name,
            description: data.description,
            methods,
          }
    );
  };

  return (
    <FormDialog
      title="New security scheme"
      defaultValues={defaultValues}
      schema={schema}
      onSubmit={onSubmit}
      trigger={<Button style={{ width: "100%" }}>New security scheme</Button>}
    >
      <NewCredentialForm />
    </FormDialog>
  );
}
