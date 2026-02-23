import styled from "styled-components";
import PlaintextEditor from "../../../../new-components/fields/PlaintextEditor";

export default function RequestBody({ variables }: { variables: string[] }) {
  return <Container>{<PlaintextEditor name={"body.value"} />}</Container>;
}

const Container = styled.div`
  margin: 8px;
  gap: 8px;
  display: flex;
  flex-flow: column;
`;
