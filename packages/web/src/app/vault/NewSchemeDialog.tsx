import * as z from "zod";

import Button from "../../components/Button";

import FormDialog from "../../new-components/FormDialog";
import NewSchemeForm from "./NewSchemeForm";
import { SchemeType } from "@xliic/common/vault";

const SCHEME_NAME_REGEX = /^[a-zA-Z0-9\._\-]*$/;
const SCHEME_NAME_REGEX_MESSAGE =
  "Only alphanumeric characters, dot, underscore or hyphen are allowed in the scheme name";

export default function NewSchemeDialog({
  onAddScheme,
  existing,
}: {
  onAddScheme: (name: string, type: SchemeType, scheme: string) => void;
  existing: string[];
}) {
  const defaultValues = {
    name: "",
    type: "basic",
    scheme: "",
  };

  const schema = z.object({
    name: z
      .string()
      .regex(SCHEME_NAME_REGEX, {
        message: SCHEME_NAME_REGEX_MESSAGE,
      })
      .refine((value) => !existing.includes(value), {
        message: "Already exists",
      }),
    type: z.string(),
  });

  const onSubmit = (data: any) => {
    onAddScheme(data.name, data.type, data.scheme);
  };

  return (
    <FormDialog
      title="New scheme"
      defaultValues={defaultValues}
      schema={schema}
      onSubmit={onSubmit}
      trigger={<Button style={{ width: "100%" }}>New scheme</Button>}
      noOverflow
    >
      <NewSchemeForm existing={existing} />
    </FormDialog>
  );
}
