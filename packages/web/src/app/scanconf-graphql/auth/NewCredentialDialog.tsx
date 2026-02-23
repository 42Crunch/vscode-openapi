import * as z from "zod";

import { Playbook } from "@xliic/scanconf";

import Button from "../../../components/Button";

import FormDialog from "../../../new-components/FormDialog";
import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../../../core/playbook/variables";
import NewCredentialForm from "./NewCredentialForm";

export const ENV_API_TOKEN = "ENV_API_TOKEN";

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
    credentialValue: "{{" + ENV_API_TOKEN + "}}",
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
    name: z.string().min(1),
    description: z.string(),
    credentialName: z.string(), // it is = id, set no constraint
    credentialValue: z.string().min(1),
  });

  const onSubmit = (data: any) => {
    const methods = {
      [data.id]: {
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
            default: data.id,
            description: data.description,
            methods,
          }
        : {
            type: data.type,
            default: data.id,
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
