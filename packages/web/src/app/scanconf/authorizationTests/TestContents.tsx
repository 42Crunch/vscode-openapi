import { useFieldArray } from "react-hook-form";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import { Plus, TrashCan } from "../../../icons";
import DownshiftSelect from "../../../new-components/fat-fields/DownshiftSelect";

export default function TestContents({ credentials }: { credentials: Playbook.Credentials }) {
  const options = flattenCredentials(credentials).map(({ name }) => ({ label: name, value: name }));

  return (
    <>
      <DownshiftSelect
        label="Type"
        name="key"
        options={[
          { value: "authentication-swapping-bola", label: "BOLA" },
          { value: "authentication-swapping-bfla", label: "BFLA" },
        ]}
      />

      <AuthArrayField label="Source" name="source" options={options} />

      <AuthArrayField label="Target" name="target" options={options} />
    </>
  );
}

function AuthArrayField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { label: string; value: string }[];
}) {
  const { fields, append, remove } = useFieldArray({ name });

  return (
    <Group>
      <GroupLabel>{label}</GroupLabel>
      {fields.map((field, index) => (
        <Row key={field.id}>
          <DownshiftSelect name={`${name}.${index}`} options={options} />
          <Remove
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              remove(index);
            }}
          >
            <TrashCan />
          </Remove>
        </Row>
      ))}
      <Add
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          append("");
        }}
      >
        <Plus /> Add {label.toLowerCase()}
      </Add>
    </Group>
  );
}

function flattenCredentials(credentials: Playbook.Credentials) {
  return Object.entries(credentials)
    .map(([credentialName, credential]) => {
      return Object.entries(credential.methods || {}).map(([methodName, method]) => {
        const name = `${credentialName}/${methodName}`;
        return { name, credential };
      });
    })
    .flat();
}

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GroupLabel = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: var(${ThemeColorVariables.inputPlaceholderForeground});
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > :first-child {
    flex: 1;
  }
`;

const Remove = styled.button`
  background: none;
  border: none;
  padding: 0;
  width: 1.5em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Add = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  border: 1px dashed var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
