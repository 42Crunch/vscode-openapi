import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";

import { useAppDispatch, useAppSelector } from "../store";
import { TestCheckResult } from "../../../core/playbook/identity-tests";

export default function Overview() {
  const dispatch = useAppDispatch();

  const { identityTestsConfiguration: config } = useAppSelector((state) => state.scanconf);

  return (
    <Container>
      {Object.keys(config).map((key) => (
        <div key={key}>
          <h2>{key}</h2>
          <SuiteFailures failures={config[key].failures} />
          {Object.entries(config[key].tests).map(([testId, result]) => (
            <div key={testId}>
              <h4>{testId}</h4>
              <TestFailures result={result} />
            </div>
          ))}
        </div>
      ))}
    </Container>
  );
}

function SuiteFailures({ failures }: { failures: Record<string, string[]> }) {
  if (Object.keys(failures).length === 0) {
    return <div>No failures</div>;
  }

  return (
    <div>
      {Object.entries(failures).map(([checkId, failureList]) => (
        <div key={checkId}>
          <h4>{checkId}</h4>
          {failureList.length === 0 ? (
            <div>No failures</div>
          ) : (
            <ul>
              {failureList.map((failure, index) => (
                <li key={index}>{failure}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function TestFailures({ result }: { result: TestCheckResult }) {
  if (result.failures.length > 0) {
    return (
      <ul>
        {result.failures.map((failure, index) => (
          <li key={index}>{failure}</li>
        ))}
      </ul>
    );
  }

  return null;
}

const Container = styled.div`
  padding: 8px;
  gap: 8px;
  display: flex;
  flex-direction: column;
`;
