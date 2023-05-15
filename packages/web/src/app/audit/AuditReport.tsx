import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";

import { useAppDispatch, useAppSelector } from "./store";

import { TabList, TabButton } from "../../components/Tabs";
import { ReportState, changeFilter, changeTab } from "./slice";

import { SummaryTiles } from "./SummaryTiles";
import PriorityIssues from "./PriorityIssues";
import FilteredIssues from "./FilteredIssues";
import SqgReport from "./SqgReport";
import InvalidReport from "./InvalidReport";

export default function AuditReport() {
  const { tab, audit } = useAppSelector((state) => state.audit);

  const dispatch = useAppDispatch();
  const setTab = (tab: string) => {
    dispatch(changeTab(tab as ReportState["tab"]));
  };

  return (
    <Container>
      {audit.valid === false && <InvalidReport />}
      <SummaryTiles />
      <SqgReport />
      <Tabs.Root value={tab} onValueChange={setTab}>
        <TabList>
          <TabButton value="priority">Priority</TabButton>
          <TabButton value="issues">Issues</TabButton>
        </TabList>
        <Tabs.Content value="priority">
          <PriorityIssues />
        </Tabs.Content>
        <Tabs.Content value="issues">
          <FilteredIssues />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}

const Container = styled.div``;
