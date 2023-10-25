import { FieldValues } from "react-hook-form";
import styled from "styled-components";
import * as z from "zod";

import * as playbook from "@xliic/common/playbook";
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
  onAddCredentialValue: (name: string, value: playbook.CredentialMethod) => void;
}) {
  const contents = (
    <>
      <Input label="Name" name="name" />
      <Input label="Value" name="value" />
    </>
  );

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
      contents={contents}
      onSubmit={onSubmit}
      schema={schema}
      trigger={
        <AddRequestButton>
          <Plus />
        </AddRequestButton>
      }
    />
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
