import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";
import LogMessages from "../../features/logging/LogMessages";
import { OasState, changeTab } from "./slice";
import { ScanSummary } from "./ScanSummary";
import ScanIssues from "./ScanIssues";
import { TabContainer } from "../../new-components/Tabs";
import { HappyPathCard } from "./HappyPathCard";

export default function ScanReport() {
  const dispatch = useAppDispatch();

  const { scanReport, operations, responses, errors, waitings, tab, issues, grouped } =
    useAppSelector((state) => state.scan);

  if (scanReport === undefined) {
    return (
      <Container>
        <Message>Report is not yet available</Message>
      </Container>
    );
  }

  const entries = Object.entries(operations);

  return (
    <TabContainer
      activeTab={tab}
      setActiveTab={(tab) => dispatch(changeTab(tab as OasState["tab"]))}
      tabs={[
        {
          id: "summary",
          title: "Summary",
          content: (
            <Summary>
              <ScanSummary
                issues={issues as any}
                global={scanReport.summary}
                scanVersion={scanReport.scanVersion}
              />
              <div style={{ fontWeight: 600, margin: "8px" }}>Happy Path Testing results</div>
              {entries.map(([operationId, operation]) => (
                <HappyPathCard
                  defaultCollapsed={entries.length > 1}
                  operationId={operationId}
                  operation={operation}
                  key={operationId}
                />
              ))}
            </Summary>
          ),
        },
        {
          id: "tests",
          title: "Tests",
          content: (
            <ScanIssues
              issues={issues}
              grouped={grouped}
              responses={responses}
              errors={errors}
              waitings={waitings}
            />
          ),
        },
        { id: "logs", title: "Logs", content: <LogMessages /> },
      ]}
    />
  );
}

const Container = styled.div``;

const Summary = styled.div`
  margin: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Message = styled.div`
  margin: 1em;
  padding: 10px;
`;
