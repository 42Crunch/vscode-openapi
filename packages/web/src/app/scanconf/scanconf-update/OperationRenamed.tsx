import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";

import { OperationRenamed as OperationRenamedType } from "@xliic/scanconf-changes";
import PathMethodCard from "../../../new-components/PathMethodCard";

export default function OperationRenamed({ change }: { change: OperationRenamedType }) {
  return (
    <Container>
      <PathMethodCard path={change.path} method={change.method} operationId={change.oldOperationId}>
        <Content>
          "{change.oldOperationId}" renamed to "{change.newOperationId}"
        </Content>
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
