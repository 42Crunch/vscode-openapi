import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { Check, ExclamationCircle } from "../../../icons";
import CollapsibleCard from "../../../new-components/CollapsibleCard";
import CollapsibleSection from "../components/CollapsibleSection";
import TryAndServerSelector from "../components/TryAndServerSelector";

import { useAppDispatch, useAppSelector } from "../store";
import { SuiteConfig, TestConfig } from "../../../core/playbook/identity-tests/types";
import { startTryExecution } from "./slice";
import Execution from "../components/execution/Execution";

export default function Test({ suite, suiteId }: { suite: SuiteConfig; suiteId: string }) {
  const dispatch = useAppDispatch();

  const servers = useAppSelector((state) => state.scanconf.servers);
  const tryResult = useAppSelector((state) => state.tests.try?.[suiteId]);

  const suiteHasFailures = Object.values(suite.failures).some((failures) => failures.length > 0);

  return (
    <Container>
      <TryAndServerSelector
        servers={servers}
        onTry={(server: string) => {
          dispatch(startTryExecution({ server, suiteId }));
        }}
      />
      <CollapsibleSection title={suiteId} defaultOpen={suiteHasFailures}>
        {Object.entries(suite.failures).map(([requirementId, failure]) => (
          <div key={requirementId}>{failure}</div>
        ))}
      </CollapsibleSection>

      {Object.keys(Object.entries(suite.tests)).length > 0 && (
        <CollapsibleSection title="Tests" defaultOpen>
          <Tests>
            {Object.entries(suite.tests).map(([testId, test]) => (
              <TestCard key={testId} testId={testId} test={test} />
            ))}
          </Tests>
        </CollapsibleSection>
      )}

      {Object.keys(tryResult || {}).length > 0 && (
        <CollapsibleSection title="Result">
          {Object.entries(tryResult).map(([testId, result]) => (
            <div key={testId}>
              <TestTitle>
                <span>{testId}</span>
                <Passed>???</Passed>
              </TestTitle>
              <Results>
                {Object.entries(result).map(([stageId, stage]) => (
                  <TestCardContent key={stageId}>
                    <CollapsibleCard>
                      <Description>
                        {stageId} <Passed>{stage.failed}</Passed>
                      </Description>
                      <TestCardBody>
                        <Execution result={stage.result} />
                      </TestCardBody>
                    </CollapsibleCard>
                  </TestCardContent>
                ))}
              </Results>
            </div>
          ))}
        </CollapsibleSection>
      )}
    </Container>
  );
}

function TestCard({ testId, test }: { testId: string; test: TestConfig }) {
  return (
    <TestCardContent>
      <CollapsibleCard>
        <Description>
          <span>{testId}</span>
          {test.ready ? <Check /> : <ExclamationCircle />}
        </Description>
        <TestCardBody>
          {test.ready ? (
            "All test requirements are satisfied"
          ) : (
            <ul>
              {Object.entries(test.failures).map(([key, failure]) => (
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

const Passed = styled.div`
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
