import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { HappyPath } from "./HappyPath";
import CollapsibleCard from "../../new-components/CollapsibleCard";
import { Check, TriangleExclamation } from "../../icons";

import { HappyPathEntry } from "./db/reportdb";

export function HappyPathCard({
  report,
  defaultCollapsed,
}: {
  report: HappyPathEntry;
  defaultCollapsed: boolean;
}) {
  const success = report.report.outcome?.testSuccessful;
  const isSuccessOrFuzzed = success !== undefined ? success : report.operation.fuzzed;

  return (
    <Container>
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <Top>
          <span>{report.operationId}</span>
          <span>{isSuccessOrFuzzed ? "Passed" : "Failed"}</span>
        </Top>
        <Bottom>
          <Method>{report.operation.method}</Method>
          <Path>{report.operation.path}</Path>
          {isSuccessOrFuzzed ? <Check /> : <TriangleExclamation />}
        </Bottom>
        <HappyPath report={report.report} />
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
