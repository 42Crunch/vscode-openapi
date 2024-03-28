import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { RuntimeOperationReport } from "@xliic/common/scan-report";

import { HappyPath } from "./HappyPath";
import CollapsibleCard, { BottomDescription } from "../../new-components/CollapsibleCard";

export function HappyPathCard({
  operation,
  operationId,
  defaultCollapsed,
}: {
  operation: RuntimeOperationReport;
  operationId: string;
  defaultCollapsed: boolean;
}) {
  return (
    <Container>
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <Top>
          <span>{operationId}</span>
          <span>{operation.fuzzed ? "Passed" : "Failed"}</span>
        </Top>
        <BottomDescription>
          <Method>{operation.method}</Method>
          <Path>{operation.path}</Path>
        </BottomDescription>
        <HappyPath operation={operation} />
      </CollapsibleCard>
    </Container>
  );
}

const Container = styled.div`
  background-color: var(${ThemeColorVariables.computedOne});
`;

const Top = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  > span:first-child {
    flex: 1;
    font-weight: 600;
  }
  > span:last-child {
    flex: none;
    font-weight: 600;
  }
`;

const Method = styled.div`
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 16px;
  text-transform: uppercase;
  font-size: 11px;
`;

const Path = styled.div`
  line-break: anywhere;
`;
