import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useAppDispatch, useAppSelector } from "./store";
import { HttpMethods } from "@xliic/common/http";
import LogMessages from "../../features/logging/LogMessages";
import { HappyPath } from "./HappyPath";
import { OasState, changeTab } from "./slice";
import { GlobalSummary, ScanReportJSONSchema, TestLogReport } from "./scan-report-new";
import { ScanSummary } from "./ScanSummary";
import ScanIssues from "./ScanIssues";
import { TabContainer } from "../../new-components/Tabs";

export default function ScanReport() {
  const dispatch = useAppDispatch();
  const { scanReport, operationId, responses, errors, waitings, tab, issues, grouped } =
    useAppSelector((state) => state.scan);

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
    <TabContainer
      activeTab={tab}
      setActiveTab={(tab) => dispatch(changeTab(tab as OasState["tab"]))}
      tabs={[
        {
          id: "summary",
          title: "Summary",
          content: (
            <>
              <ScanSummary
                issues={issues as any}
                global={scanReport.summary as GlobalSummary}
                operation={operation?.summary!}
              />
              {happyPath && (
                <HappyPath
                  operation={operation!}
                  issue={happyPath}
                  responses={responses}
                  errors={errors}
                  waitings={waitings}
                />
              )}
            </>
          ),
        },
        {
          id: "tests",
          title: "Tests",
          content: (
            <ScanIssues
              operation={operation!}
              issues={issues as TestLogReport[]}
              grouped={grouped as Record<string, TestLogReport[]>}
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

const Message = styled.div`
  margin: 1em;
  padding: 10px;
`;