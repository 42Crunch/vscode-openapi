import styled from "styled-components";
import { TabContainer } from "../../new-components/Tabs";
import FilteredIssues from "./FilteredIssues";
import InvalidReport from "./InvalidReport";
import PriorityIssues from "./PriorityIssues";
import SqgReport from "./SqgReport";
import { SummaryTiles } from "./SummaryTiles";
import { ReportState, changeFilter, changeTab } from "./slice";
import { useAppDispatch, useAppSelector } from "./store";

export default function AuditReport() {
  const dispatch = useAppDispatch();
  const { tab, audit } = useAppSelector((state) => state.audit);

  return (
    <Container>
      {audit.valid === false && (
        <InvalidReport
          onShowIssues={() => {
            dispatch(changeTab("issues"));
            dispatch(changeFilter({ domain: "oasconformance", severity: "critical" }));
          }}
        />
      )}
      <SummaryTiles />
      <SqgReport />
      <TabContainer
        activeTab={tab}
        setActiveTab={(tab) => dispatch(changeTab(tab as ReportState["tab"]))}
        tabs={[
          {
            id: "priority",
            title: "Priority",
            content: <PriorityIssues />,
          },
          { id: "issues", title: "Issues", content: <FilteredIssues /> },
        ]}
      />
    </Container>
  );
}

const Container = styled.div``;
