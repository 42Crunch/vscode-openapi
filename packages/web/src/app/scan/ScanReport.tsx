import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";

import { ThemeColorVariables } from "@xliic/common/theme";
import { useAppDispatch, useAppSelector } from "./store";
import { HttpMethods } from "@xliic/common/http";
import { TestLogReport } from "@xliic/common/scan-report";

import { TabList, TabButton } from "../../components/Tabs";
import LogMessages from "../../features/logging/LogMessages";
import { HappyPath } from "./HappyPath";
import { ScanSummary } from "./ScanSummary";
import ScanIssues from "./ScanIssues";
import { useState } from "react";

export default function ScanReport() {
  const { scanReport, path, method, responses, errors, waitings } = useAppSelector(
    (state) => state.scan
  );

  const [activeTab, setActiveTab] = useState("summary");

  if (scanReport === undefined) {
    return (
      <Container>
        <Message>Report is not yet available</Message>
      </Container>
    );
  }

  const happyPath = scanReport.paths?.[path!]?.[method!]?.["happyPaths"]?.[0];
  const operation = scanReport.paths?.[path!]?.["summary"]!;

  const issues: TestLogReport[] = [];
  for (const method of HttpMethods) {
    const conformanceIssues = scanReport?.paths?.[path!]?.[method!]?.conformanceRequestIssues;
    if (conformanceIssues !== undefined) {
      issues.push(...conformanceIssues);
    }
  }

  return (
    <Container>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          <TabButton value="summary">Summary</TabButton>
          <TabButton value="tests">Tests</TabButton>
          <TabButton value="logs">Logs</TabButton>
        </TabList>
        <Tabs.Content value="summary">
          <ScanSummary global={scanReport.summary} operation={operation} />
          {happyPath && (
            <HappyPath
              issue={happyPath}
              responses={responses}
              errors={errors}
              waitings={waitings}
            />
          )}
        </Tabs.Content>
        <Tabs.Content value="tests">
          <ScanIssues issues={issues} responses={responses} errors={errors} waitings={waitings} />
        </Tabs.Content>
        <Tabs.Content value="logs">
          <LogMessages />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}

const Container = styled.div``;

const Message = styled.div`
  margin: 1em;
  padding: 10px;
`;
