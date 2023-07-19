import styled from "styled-components";
import { DateTime } from "luxon";
import { ThemeColorVariables } from "@xliic/common/theme";
import { ArrowUpRightFromSquare } from "../../icons";
import { useAppDispatch } from "./store";
import { changeFilter, changeTab } from "./slice";
import { GlobalSummary, OperationSummary } from "./scan-report-new";

export function ScanSummaryNew({
  global,
  operation,
}: {
  global: GlobalSummary;
  operation: OperationSummary;
}) {
  const dispatch = useAppDispatch();

  const critical = global.issues.critical ?? 0;
  const high = global.issues.high ?? 0;

  const executed =
    (global.conformanceTestRequests.executed.total ?? 0) +
    (global.methodNotAllowedTestRequests?.executed.total ?? 0);

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
            {executed} <ArrowUpRightFromSquare />
          </div>
          <div>Executed</div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("tests"));
            dispatch(changeFilter({}));
          }}
        >
          <div>
            {global.issues.total ?? 0} <ArrowUpRightFromSquare />
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
            {critical + high} <ArrowUpRightFromSquare />
          </div>
          <div>Critical/High</div>
        </div>
      </Tiles>
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
`;

const Tiles = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
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
