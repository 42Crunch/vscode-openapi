import * as z from "zod";

import * as playbook from "@xliic/common/playbook";

import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Select from "../../../components/Select";
import FormDialog from "../../../new-components/FormDialog";
import { s } from "vitest/dist/reporters-5f784f42";

export default function NewCredentialDialog({
  onAddCredential,
  existing,
}: {
  onAddCredential: (id: string, credential: playbook.Credential) => void;
  existing: string[];
}) {
  const contents = (
    <>
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
    </>
  );

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
      .regex(/^\w+$/)
      .refine((value) => !existing.includes(value), {
        message: "Already exists",
      }),
    name: z.string().min(1),
    credentialName: z.string().regex(/^\w+$/),
    credentialValue: z.string().min(1),
  });

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
    <FormDialog
      title="New credential"
      contents={contents}
      defaultValues={defaultValues}
      schema={schema}
      onSubmit={onSubmit}
      trigger={<Button style={{ width: "100%" }}>New credential</Button>}
    />
  );
}
