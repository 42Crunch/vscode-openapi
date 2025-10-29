import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useAppDispatch, useAppSelector } from "../store";
import { TestCheckResult } from "../../../core/playbook/identity-tests";
import { Check, CircleCheck, ExclamationCircle, TriangleExclamation } from "../../../icons";
import CollapsibleCard from "../../../new-components/CollapsibleCard";
import { Checkbox } from "../../../new-components/Checkbox";

export default function Overview() {
  const dispatch = useAppDispatch();

  const { identityTestsConfiguration: config } = useAppSelector((state) => state.scanconf);

  return (
    <Container>
      <CollapsibleCard>
        <Description>
          <span>Foo</span>
          <CircleCheck />
        </Description>
        <div>zomg</div>
      </CollapsibleCard>

      <CollapsibleCard>
        <Description>
          <span>Bar</span>
          <TriangleExclamation />
        </Description>
        <div>zomg</div>
      </CollapsibleCard>

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
  if (result.failures.length === 0) {
    return (
      <div>
        No failures <CircleCheck />
      </div>
    );
  }

  return (
    <ul>
      {result.failures.map((failure, index) => (
        <li key={index}>
          {failure} <TriangleExclamation />
        </li>
      ))}
    </ul>
  );
}

const Container = styled.div`
  padding: 8px;
  gap: 8px;
  display: flex;
  flex-direction: column;
`;

export const Description = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  > span {
    > svg {
      fill: var(${ThemeColorVariables.linkForeground});
    }
    flex: 1;
    font-weight: 600;
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
`;
