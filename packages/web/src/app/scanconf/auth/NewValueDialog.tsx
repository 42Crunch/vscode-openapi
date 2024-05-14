import { FieldValues } from "react-hook-form";
import styled from "styled-components";
import * as z from "zod";

import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import Input from "../../../components/Input";
import { Plus } from "../../../icons";
import FormDialog from "../../../new-components/FormDialog";
import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../../../core/playbook/variables";

export default function NewValueDialog({
  onAddCredentialValue,
  existing,
}: {
  existing: string[];
  onAddCredentialValue: (name: string, value: Playbook.CredentialMethod) => void;
}) {
  const defaultValues = { name: "", value: "" };

  const onSubmit = (values: FieldValues) => {
    onAddCredentialValue(values.name, { credential: values.value, requests: [] });
  };

  const schema = z.object({
    name: z
      .string()
      .regex(ENV_VAR_NAME_REGEX(), {
        message: ENV_VAR_NAME_REGEX_MESSAGE,
      })
      .refine((value) => !existing.includes(value), {
        message: "Already exists",
      }),
    value: z.string().min(1),
  });

  return (
    <FormDialog
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      schema={schema}
      trigger={
        <AddRequestButton>
          <Plus />
        </AddRequestButton>
      }
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
