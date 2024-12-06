import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { RuntimeOperationReport } from "@xliic/common/scan-report";

import { HappyPath } from "./HappyPath";
import CollapsibleCard from "../../new-components/CollapsibleCard";
import { Check, TriangleExclamation } from "../../icons";

export function HappyPathCard({
  operation,
  operationId,
  defaultCollapsed,
}: {
  operation: RuntimeOperationReport;
  operationId: string;
  defaultCollapsed: boolean;
}) {
  const successes = operation.scenarios?.map((scenario) => scenario?.outcome?.testSuccessful);
  const hasSuccess = successes !== undefined && successes.every((success) => success !== undefined);
  const isSuccessOrFuzzed = hasSuccess ? successes.every((success) => success) : operation.fuzzed;

  return (
    <Container>
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <Top>
          <span>{operationId}</span>
          <span>{isSuccessOrFuzzed ? "Passed" : "Failed"}</span>
        </Top>
        <Bottom>
          <Method>{operation.method}</Method>
          <Path>{operation.path}</Path>
          {isSuccessOrFuzzed ? <Check /> : <TriangleExclamation />}
        </Bottom>
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

export const Bottom = styled.div`
  display: flex;
  font-size: 90%;
  align-items: center;
  gap: 16px;
  > svg {
    margin-left: auto;
    margin-right: 2px;
    width: 14px;
    height: 14px;
    fill: var(${ThemeColorVariables.foreground});
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
