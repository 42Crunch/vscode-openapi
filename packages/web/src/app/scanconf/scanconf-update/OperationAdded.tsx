import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";

import { OperationAdded as OperationAddedType } from "@xliic/scanconf-changes";
import PathMethodCard from "../../../new-components/PathMethodCard";

export default function OperationAdded({ change }: { change: OperationAddedType }) {
  return (
    <Container>
      <PathMethodCard path={change.path} method={change.method} operationId={change.operationId} />
    </Container>
  );
}

const Container = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  padding: 8px;
  background-color: var(${ThemeColorVariables.computedOne});
`;
