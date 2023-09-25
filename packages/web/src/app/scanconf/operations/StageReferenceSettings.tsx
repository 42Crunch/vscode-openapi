import styled from "styled-components";
import Input from "../components/Input";
import FormSwitch from "../../../components/FormSwitch";

export default function StageReferenceSettings() {
  return (
    <Container>
      <FormSwitch label="Fuzzing" name="fuzzing" />
      <Input label="Expected Response" name="expectedResponse" />
    </Container>
  );
}

const Container = styled.div`
  margin-left: 4px;
  margin-right: 4px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 8px;
  > div {
    line-break: anywhere;
  }
`;
