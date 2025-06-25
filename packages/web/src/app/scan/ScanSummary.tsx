import styled from "styled-components";
import { DateTime } from "luxon";

import { ThemeColorVariables } from "@xliic/common/theme";

import { ArrowUpRightFromSquare } from "../../icons";
import { useAppDispatch } from "./store";
import { changeFilter, changeTab, State } from "./slice";

export function ScanSummary({ report }: { report: NonNullable<State["scanReport"]> }) {
  const dispatch = useAppDispatch();

  return (
    <Container>
      <Stats>
        <div>
          Status: <b>{report.summary.state}</b> (Exit code: {report.summary.exitCode})
        </div>
        <div>{DateTime.fromISO(report.summary.endDate).toLocaleString(DateTime.DATETIME_MED)}</div>
        <div>
          Execution time:{" "}
          {DateTime.fromISO(report.summary.endDate)
            .diff(DateTime.fromISO(report.summary.startDate))
            .toFormat("mm:ss.SSS")}
        </div>
        <div>Scan version: {report.scanVersion}</div>
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
            {report.stats.issues} <ArrowUpRightFromSquare />
          </div>
          <div>Executed</div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("tests"));
            dispatch(changeFilter({ criticality: 2 }));
          }}
        >
          <div>
            {report.stats.lowAndAbove} <ArrowUpRightFromSquare />
          </div>
          <div>Issues Found</div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("tests"));
            dispatch(changeFilter({ criticality: 4 }));
          }}
        >
          <div>
            {report.stats.criticalAndHigh} <ArrowUpRightFromSquare />
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
