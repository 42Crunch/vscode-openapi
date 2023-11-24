import { FieldValues } from "react-hook-form";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import FormDialog from "../../../../new-components/FormDialog";
import { Plus } from "../../../../icons";
import DownshiftSelect from "../../../../new-components/fields/DownshiftSelect";

export default function AddResponseDialog({
  add,
  responseCodes,
  existingCodes,
}: {
  add: any;
  responseCodes: string[];
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

  return (
    <FormDialog
      title="Add response processing"
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      trigger={
        <AddButton>
          <Plus />
        </AddButton>
      }
    >
      <ResponseForm responseCodes={responseCodes} existingCodes={existingCodes} />
    </FormDialog>
  );
}

function ResponseForm({
  responseCodes,
  existingCodes,
}: {
  responseCodes: string[];
  existingCodes: string[];
}) {
  return (
    <Container>
      <DownshiftSelect name="code" options={getOptions(responseCodes, existingCodes)} />
    </Container>
  );
}

function getOptions(codes: string[], existing: string[]) {
  return codes
    .filter((code) => !existing.includes(code))
    .map((code) => ({ label: code, value: code }));
}

function convertToNumberOrString(input: string): number | string {
  if (/^\d+$/.test(input)) {
    return parseInt(input, 10);
  } else {
    return input;
  }
}

const Container = styled.div`
  > div > div {
    padding: 4px;
  }
`;

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
