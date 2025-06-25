import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";
import LogMessages from "../../features/logging/LogMessages";
import { State, changeTab } from "./slice";
import { ScanSummary } from "./ScanSummary";
import ScanIssues from "./ScanIssues";
import { TabContainer } from "../../new-components/Tabs";
import { HappyPathCard } from "./HappyPathCard";

export default function ScanReport() {
  const dispatch = useAppDispatch();

  const { scanReport, tab, happyPathPage } = useAppSelector((state) => state.scan);

  if (scanReport === undefined) {
    return (
      <Container>
        <Message>Report is not yet available</Message>
      </Container>
    );
  }

  return (
    <TabContainer
      activeTab={tab}
      setActiveTab={(tab) => dispatch(changeTab(tab as State["tab"]))}
      tabs={[
        {
          id: "summary",
          title: "Summary",
          content: (
            <Summary>
              <ScanSummary report={scanReport} />
              <div style={{ fontWeight: 600, margin: "8px" }}>Happy Path Testing results</div>

              {happyPathPage.items.map((entry, index) => (
                <HappyPathCard defaultCollapsed={true} report={entry} key={index} />
              ))}
            </Summary>
          ),
        },
        {
          id: "tests",
          title: "Tests",
          content: <ScanIssues />,
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
