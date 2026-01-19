import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { Check, ExclamationCircle } from "../../../icons";
import CollapsibleCard from "../../../new-components/CollapsibleCard";
import CollapsibleSection from "../components/CollapsibleSection";
import TryAndServerSelector from "../components/TryAndServerSelector";

import { useAppDispatch, useAppSelector } from "../store";
import { Suite, SuiteConfig, TestConfig } from "../../../core/playbook-tests/types";
import { StageResult, startTryExecution, SuiteResult } from "./slice";
import Execution from "../components/execution/Execution";
import { Result } from "@xliic/result";

export default function Test({ suite, suiteId }: { suite: SuiteConfig; suiteId: string }) {
  const dispatch = useAppDispatch();

  const servers = useAppSelector((state) => state.scanconf.servers);
  const tryResult = useAppSelector((state) => state.tests.try?.[suiteId]);

  const [tests, suiteFailures] = suite;

  const suiteHasFailures =
    suiteFailures && Object.values(suiteFailures).some((failure) => failure.length > 0);

  return (
    <Container>
      <TryAndServerSelector
        servers={servers}
        onTry={(server: string) => {
          dispatch(startTryExecution({ server, suiteId }));
        }}
      />
      {suiteFailures && (
        <CollapsibleSection title={suiteId} defaultOpen={suiteHasFailures}>
          {Object.entries(suiteFailures).map(([requirementId, failure]) => (
            <div key={requirementId}>{failure}</div>
          ))}
        </CollapsibleSection>
      )}

      {tests && Object.keys(tests).length > 0 && (
        <CollapsibleSection title="Tests" defaultOpen>
          <Tests>
            {Object.entries(tests).map(([testId, testResult]) => (
              <TestCard key={testId} testId={testId} testResult={testResult} />
            ))}
          </Tests>
        </CollapsibleSection>
      )}

      {Object.keys(tryResult || {}).length > 0 && (
        <CollapsibleSection title="Result">
          {Object.entries(tryResult).map(([testId, result]) => (
            <TestResultCard key={testId} testId={testId} result={result} />
          ))}
        </CollapsibleSection>
      )}
    </Container>
  );
}

function TestResultCard({ testId, result }: { testId: string; result: StageResult }) {
  const hasFailures = Object.values(result).some((stage: any) => stage.failed);

  return (
    <div>
      <TestTitle>
        <span>{testId}</span>
        <Status>{hasFailures ? "Failed" : "Passed"}</Status>
      </TestTitle>
      <Results>
        {Object.entries(result).map(([stageId, stage]) => (
          <TestCardContent key={stageId}>
            <CollapsibleCard>
              <Description>
                <span> {stageId}</span>
                <div>{stage.failures.length > 0 ? <ExclamationCircle /> : <Check />}</div>
              </Description>
              <TestCardBody>
                <Execution result={stage.result} />
                {stage.failures.length > 0 && (
                  <Failure>{stage.failures.map((f) => JSON.stringify(f)).join(", ")}</Failure>
                )}
              </TestCardBody>
            </CollapsibleCard>
          </TestCardContent>
        ))}
      </Results>
    </div>
  );
}

function TestCard({
  testId,
  testResult,
}: {
  testId: string;
  testResult: Result<TestConfig, Record<string, string>>;
}) {
  const [test, failures] = testResult;
  const ready = !failures;

  return (
    <TestCardContent>
      <CollapsibleCard>
        <Description>
          <span>{testId}</span>
          {ready ? <Check /> : <ExclamationCircle />}
        </Description>
        <TestCardBody>
          {ready ? (
            "All test requirements are satisfied"
          ) : (
            <ul>
              {Object.entries(failures).map(([key, failure]) => (
                <li key={key}>{failure}</li>
              ))}
            </ul>
          )}
        </TestCardBody>
      </CollapsibleCard>
    </TestCardContent>
  );
}

const Container = styled.div`
  padding: 8px;
  gap: 8px;
  display: flex;
  flex-direction: column;
`;

const Tests = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Results = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TestCardContent = styled.div`
  background-color: var(${ThemeColorVariables.background});
`;

const TestCardBody = styled.div`
  padding: 8px;
`;

export const Description = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: space-between;
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

const TestTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  > span {
    font-weight: 600;
  }
`;

const Status = styled.div`
  text-transform: uppercase;
  padding-left: 1rem;
  padding-right: 1rem;
  display: flex;
  align-items: center;
  width: 6em;
  font-size: 0.75rem;
  border-radius: 4px;
  font-weight: 450;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  color: var(${ThemeColorVariables.badgeForeground});
  background-color: var(${ThemeColorVariables.badgeBackground});
`;

const Failure = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: var(${ThemeColorVariables.errorBackground});
  color: var(${ThemeColorVariables.errorForeground});
  border-radius: 4px;
`;
