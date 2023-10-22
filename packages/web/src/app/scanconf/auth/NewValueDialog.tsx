import { FieldValues } from "react-hook-form";
import styled from "styled-components";

import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";

import Input from "../../../components/Input";
import { Plus } from "../../../icons";
import FormDialog from "../../../new-components/FormDialog";

export default function NewValueDialog({
  onAddCredentialValue,
}: {
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

  return (
    <FormDialog
      defaultValues={defaultValues}
      contents={contents}
      onSubmit={onSubmit}
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
