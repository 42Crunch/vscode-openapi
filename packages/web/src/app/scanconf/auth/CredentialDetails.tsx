import styled from "styled-components";
import { useFormContext } from "react-hook-form";

import * as playbook from "@xliic/common/playbook";

import Input from "../../../components/Input";
import Select from "../../../components/Select";
import Form from "../../../new-components/Form";
import { unwrapCredential, wrapCredential } from "./form";

export default function CredentialDetails({
  credential,
  saveCredential,
}: {
  credential: playbook.Credential;
  saveCredential: (credential: playbook.Credential) => void;
}) {
  return (
    <Form
      data={credential}
      saveData={saveCredential}
      wrapFormData={wrapCredential}
      unwrapFormData={unwrapCredential}
    >
      <CredentialGeneral />
    </Form>
  );
}

export function CredentialGeneral() {
  const { getValues } = useFormContext();
  const methods = getValues("methods") || [];

  return (
    <Container>
      <Select
        label="Default credential value"
        name="default"
        options={methods.map((method: any) => ({ label: method.key, value: method.key }))}
      />
      <Input label="Type" name="type" disabled />
      <Input label="Location" name="in" disabled />
      <Input label="Name" name="name" disabled />
    </Container>
  );
}

export const Container = styled.div`
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
