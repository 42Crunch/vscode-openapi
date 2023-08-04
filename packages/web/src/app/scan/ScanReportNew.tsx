import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";

import { ThemeColorVariables } from "@xliic/common/theme";
import { useAppDispatch, useAppSelector } from "./store";
import { HttpMethods } from "@xliic/common/http";

import { TabList, TabButton } from "../../components/Tabs";
import LogMessages from "../../features/logging/LogMessages";
import { HappyPathNew } from "./HappyPathNew";
import { OasState, changeTab } from "./slice";
import { GlobalSummary, ScanReportJSONSchema, TestLogReport } from "./scan-report-new";
import { ScanSummaryNew } from "./ScanSummaryNew";
import ScanIssuesNew from "./ScanIssuesNew";

export default function ScanReportNew() {
  const { scanReport, operationId, responses, errors, waitings, tab, issues, grouped } =
    useAppSelector((state) => state.scan);

  const dispatch = useAppDispatch();
  const setTab = (tab: string) => {
    dispatch(changeTab(tab as OasState["tab"]));
  };

  if (scanReport === undefined) {
    return (
      <Container>
        <Message>Report is not yet available</Message>
      </Container>
    );
  }

  const happyPath = (scanReport as ScanReportJSONSchema).operations?.[operationId!].scenarios?.[0];

  const operation = (scanReport as ScanReportJSONSchema).operations?.[operationId!];

  return (
    <Container>
      <Tabs.Root value={tab} onValueChange={setTab}>
        <TabList>
          <TabButton value="summary">Summary</TabButton>
          <TabButton value="tests">Tests</TabButton>
          <TabButton value="logs">Logs</TabButton>
        </TabList>
        <Tabs.Content value="summary">
          <ScanSummaryNew
            global={scanReport.summary as GlobalSummary}
            operation={operation?.summary!}
          />
          {happyPath && (
            <HappyPathNew
              operation={operation!}
              issue={happyPath}
              responses={responses}
              errors={errors}
              waitings={waitings}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="tests">
          <ScanIssuesNew
            operation={operation!}
            issues={issues as TestLogReport[]}
            grouped={grouped as Record<string, TestLogReport[]>}
            responses={responses}
            errors={errors}
            waitings={waitings}
          />
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
