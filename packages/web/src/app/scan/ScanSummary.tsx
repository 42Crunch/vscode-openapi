import styled from "styled-components";
import { DateTime } from "luxon";
import { ThemeColorVariables } from "@xliic/common/theme";
import { GlobalSummary, OperationSummary } from "@xliic/common/scan-report";

export function ScanSummary({
  global,
  operation,
}: {
  global: GlobalSummary;
  operation: OperationSummary;
}) {
  const critical = operation.issues.critical ?? 0;
  const high = operation.issues.high ?? 0;

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
        <div>
          <div>{operation.conformanceTestRequests.executed}</div>
          <div>Executed</div>
        </div>
        <div>
          <div>{operation.issues.total ?? 0}</div>
          <div>Issues Found</div>
        </div>
        <div>
          <div>{critical + high}</div>
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
