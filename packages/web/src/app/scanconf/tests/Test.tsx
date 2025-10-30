import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import { ItemId } from "../../../components/layout/SearchSidebar";
import Form from "../../../new-components/Form";
import { Check, CircleCheck, ExclamationCircle, TriangleExclamation } from "../../../icons";
import CollapsibleCard from "../../../new-components/CollapsibleCard";
import CollapsibleSection from "../components/CollapsibleSection";
import TryAndServerSelector from "../components/TryAndServerSelector";

import { saveAuthorizationTest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { TestSuitCheckResult } from "../../../core/playbook/identity-tests";

export default function Test({ suite, suiteId }: { suite: TestSuitCheckResult; suiteId: string }) {
  // const dispatch = useAppDispatch();

  // const {
  //   playbook: { authorizationTests },
  // } = useAppSelector((state) => state.scanconf);

  const { servers } = useAppSelector((state) => state.scanconf);

  const suiteHasFailures = Object.values(suite.failures).some((failures) => failures.length > 0);

  return (
    <Container>
      <h3></h3>
      <TryAndServerSelector servers={servers} onTry={(server: string) => {}} />
      <CollapsibleSection title={suiteId} defaultOpen={suiteHasFailures}>
        {Object.entries(suite.failures).map(([requirementId, failures]) => (
          <div key={requirementId}>
            {failures.length > 0 ? (
              <ul>
                {failures.map((failure, idx) => (
                  <li key={idx}>{failure}</li>
                ))}
              </ul>
            ) : (
              <p>All test suite requirements are satisfied</p>
            )}
          </div>
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
    </Container>
  );
}

function TestCard({ testId, test }: { testId: string; test: { failures: string[] } }) {
  const hasFailures = test.failures.length > 0;

  return (
    <TestCardContent>
      <CollapsibleCard>
        <Description>
          <span>{testId}</span>
          {hasFailures ? <ExclamationCircle /> : <Check />}
        </Description>
        <TestCardBody>
          {hasFailures ? (
            <ul>
              {test.failures.map((failure, idx) => (
                <li key={idx}>{failure}</li>
              ))}
            </ul>
          ) : (
            "All test requirements are satisfied"
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
