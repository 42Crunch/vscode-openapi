import { FieldValues } from "react-hook-form";
import styled from "styled-components";
import * as z from "zod";

import { ThemeColorVariables } from "@xliic/common/theme";

import FormDialog from "../../../../new-components/FormDialog";
import Input from "../Input";
import { Plus } from "../../../../icons";

export default function AddResponseDialog({
  add,
  existingCodes,
}: {
  add: any;
  existingCodes: string[];
}) {
  const defaultValues = { code: "200" };

  const onSubmit = (values: FieldValues) => {
    add({
      key: values.code,
      value: {
        expectations: {
          httpStatus: convertToNumberOrString(values.code),
        },
        variableAssignments: [],
      },
    });
  };

  // FIXME implement "code" validation in the form, must be a number or "2XX", "default", etc
  const schema = z.object({
    code: z.string().refine((value) => !existingCodes.includes(value), {
      message: "Already exists",
    }),
  });

  return (
    <FormDialog
      title="Add response processing"
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      schema={schema}
      trigger={
        <AddButton>
          <Plus />
        </AddButton>
      }
    >
      <ResponseForm />
    </FormDialog>
  );
}

function ResponseForm() {
  return (
    <>
      <Input label="Response code" name="code" />
    </>
  );
}

function convertToNumberOrString(input: string): number | string {
  if (/^\d+$/.test(input)) {
    return parseInt(input, 10);
  } else {
    return input;
  }
}

const AddButton = styled.button`
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
