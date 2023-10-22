import styled from "styled-components";
import { useFormContext } from "react-hook-form";

import Input from "../../../components/Input";
import Select from "../../../components/Select";

export default function CredentialGeneral() {
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
  margin: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
