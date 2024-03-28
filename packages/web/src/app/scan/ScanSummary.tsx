import styled from "styled-components";
import { DateTime } from "luxon";

import { ThemeColorVariables } from "@xliic/common/theme";

import { ArrowUpRightFromSquare } from "../../icons";
import { useAppDispatch } from "./store";
import { changeFilter, changeTab } from "./slice";
import { GlobalSummary, TestLogReport } from "@xliic/common/scan-report";

export function ScanSummary({
  global,
  issues,
  scanVersion,
}: {
  global: GlobalSummary;
  issues: TestLogReport[];
  scanVersion: string;
}) {
  const dispatch = useAppDispatch();

  // const executed =
  //   (global.conformanceTestRequests.executed.total ?? 0) +
  //   (global.authorizationTestRequests.executed.total ?? 0) +
  //   (global.customTestRequests.executed.total ?? 0) +
  //   (global.methodNotAllowedTestRequests?.executed.total ?? 0);

  // const issuesNumber = issues?.length | 0;

  const lowAndAbove = issues.filter(
    (issue) => issue?.outcome?.criticality && issue.outcome?.criticality >= 1
  ).length;

  const criticalAndHigh = issues.filter(
    (issue) => issue?.outcome?.criticality && issue.outcome?.criticality >= 4
  ).length;

  return (
    <Container>
      <Stats>
        <div>
          Status: <b>{global.state}</b> (Exit code: {global.exitCode})
        </div>
        <div>{DateTime.fromISO(global.endDate).toLocaleString(DateTime.DATETIME_MED)}</div>
        <div>
          Execution time:{" "}
          {DateTime.fromISO(global.endDate)
            .diff(DateTime.fromISO(global.startDate))
            .toFormat("mm:ss.SSS")}
        </div>
        <div>Scan version: {scanVersion}</div>
      </Stats>
      <Tiles>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("tests"));
            dispatch(changeFilter({}));
          }}
        >
          <div>
            {issues.length} <ArrowUpRightFromSquare />
          </div>
          <div>Executed</div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("tests"));
            dispatch(changeFilter({ severity: "low" }));
          }}
        >
          <div>
            {lowAndAbove} <ArrowUpRightFromSquare />
          </div>
          <div>Issues Found</div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("tests"));
            dispatch(changeFilter({ severity: "high" }));
          }}
        >
          <div>
            {criticalAndHigh} <ArrowUpRightFromSquare />
          </div>
          <div>Critical/High</div>
        </div>
      </Tiles>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Tiles = styled.div`
  display: flex;
  gap: 8px;
  & > div {
    cursor: pointer;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    border: 1px solid var(${ThemeColorVariables.border});
  }
`;

const Stats = styled.div`
  display: flex;
  border: 1px solid var(${ThemeColorVariables.border});
  padding: 4px;
  & > div + div {
    border-left: 2px solid var(${ThemeColorVariables.border});
    padding-left: 4px;
    margin-left: 4px;
  }
`;
