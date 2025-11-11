import * as z from "zod";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { SchemeType } from "@xliic/common/vault";

import FormDialog from "../../new-components/FormDialog";
import NewSchemeForm from "./NewSchemeForm";
import { Plus } from "../../icons";

const SCHEME_NAME_REGEX = /^[a-zA-Z0-9\._\-]*$/;
const SCHEME_NAME_REGEX_MESSAGE =
  "Only alphanumeric characters, dot, underscore or hyphen are allowed in the scheme name";

export default function NewCredentialDialog({
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
      trigger={
        <Trigger>
          <Plus />
          New Credential
        </Trigger>
      }
      noOverflow
    >
      <NewSchemeForm existing={existing} />
    </FormDialog>
  );
}

const Trigger = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  cusror: pointer;
  border: 1px dashed var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
