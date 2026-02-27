import styled from "styled-components";
import PlaintextEditor from "../../../../new-components/fields/PlaintextEditor";

export default function RequestBody({
  variables,
  readOnly,
}: {
  variables: string[];
  readOnly?: boolean;
}) {
  return <Container>{<PlaintextEditor name={"body.value"} readOnly={readOnly} />}</Container>;
}

const Container = styled.div`
  margin: 8px;
  gap: 8px;
  display: flex;
  flex-flow: column;
`;
