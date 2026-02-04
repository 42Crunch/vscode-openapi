import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";

import { OperationRemoved as OperationRemovedType } from "@xliic/scanconf-changes";
import PathMethodCard from "../../../new-components/PathMethodCard";

export default function OperationRemoved({ change }: { change: OperationRemovedType }) {
  return (
    <Container>
      <PathMethodCard path={change.path} method={change.method} operationId={change.operationId}>
        {change.references.length > 0 && (
          <Content>References in {change.references.length} locations will be removed</Content>
        )}
      </PathMethodCard>
    </Container>
  );
}

const Container = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  padding: 8px;
  background-color: var(${ThemeColorVariables.computedOne});
`;

const Content = styled.div`
  padding: 8px;
  background-color: var(${ThemeColorVariables.background});
`;
