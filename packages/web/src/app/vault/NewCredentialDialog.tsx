import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { SchemeType, SecurityCredential } from "@xliic/common/vault";

import FormDialog from "../../new-components/FormDialog";
import { Plus } from "../../icons";
import { credentialFormSchema } from "./credential-schema";
import EditCredentialForm from "./EditCredentialForm";

export default function NewCredentialDialog({
  onCredentialAdd,
  existing,
  schemeType,
}: {
  onCredentialAdd: (name: string, value: SecurityCredential) => void;
  existing: string[];
  schemeType: SchemeType;
}) {
  const defaultValues: Record<SchemeType, Record<string, unknown>> = {
    basic: { name: "", username: "", password: "", scopes: [] },
    apiKey: { name: "", key: "", scopes: [] },
    alias: { name: "" },
    bearer: { name: "", token: "", format: "", scopes: [] },
    oauth2: { name: "", token: "", scopes: [] },
    openIdConnect: { name: "", token: "", scopes: [] },
    mutualTLS: { name: "", pkcsData: "", pkcsPassword: "", scopes: [] },
  };

  const onSubmit = (data: any) => {
    const name = data.name;
    delete data.name;
    onCredentialAdd(name, data);
  };

  return (
    <FormDialog
      title="New credential"
      defaultValues={defaultValues[schemeType]}
      schema={credentialFormSchema(undefined, existing)[schemeType]}
      onSubmit={onSubmit}
      trigger={
        <Trigger>
          <Plus />
          New Credential
        </Trigger>
      }
      noOverflow
    >
      <EditCredentialForm schemeType={schemeType} />
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
