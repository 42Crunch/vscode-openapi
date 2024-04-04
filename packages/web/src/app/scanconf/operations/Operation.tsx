import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";
import { serialize } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import { makeEnvEnv } from "../../../core/playbook/execute";
import { runScan } from "../actions";
import CollapsibleSection from "../components/CollapsibleSection";
import TryAndServerSelector from "../components/TryAndServerSelector";
import Execution from "../components/execution/Execution";
import { findResult } from "../playbook-execution-handler";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Scenario from "./Scenario";
import Scenarios from "./Scenarios";
import AddRequest from "./components/AddRequest";
import { startTryExecution } from "./slice";
import AddAuthorizationTest from "./components/AddAuthorizationTest";
import AuthorizationTests from "./AuthorizationTests";
import { ErrorBanner } from "../../../components/Banner";
import { extractScanconf, optionallyReplaceLocalhost } from "./util";

export default function Operation({ operationId }: { operationId: string }) {
  const dispatch = useAppDispatch();

  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);
  const config = useAppSelector((state) => state.config.data);

  const { mockResult, tryResult } = useAppSelector((state) => state.operations);
  const env = useAppSelector((state) => state.env.data);

  const removeStage = (location: Playbook.StageLocation) => dispatch(actions.removeStage(location));

  const saveStage = (location: Playbook.StageLocation, stage: Playbook.StageReference) =>
    dispatch(actions.saveOperationReference({ location, reference: stage }));

  const moveStage = (location: Playbook.StageLocation, to: number) =>
    dispatch(actions.moveStage({ location, to }));

  const addStage = (container: Playbook.StageContainer, ref: Playbook.RequestRef) => {
    dispatch(
      actions.addStage({
        container,
        stage: {
          ref,
        },
      })
    );
  };

  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});
  const operation = playbook.operations[operationId];

  const {
    simple,
    environment: {
      env: { host },
    },
  } = makeEnvEnv(Playbook.getCurrentEnvironment(playbook), env);

  if (operation === undefined) {
    return (
      <ErrorBanner
        message={`Unable to find operation with operationId "${operationId}" in scan configuration`}
      >
        <p>
          Verify if the OpenAPI file contains operations that were added after the scan
          configuration was created. If needed, consider deleting and recreating the scan
          configuration.
        </p>
      </ErrorBanner>
    );
  }

  return (
    <Container>
      <TryAndServerSelector
        servers={servers}
        host={host as string | undefined}
        onTry={(server: string) => {
          dispatch(startTryExecution(server));
        }}
        onScan={(server: string) => {
          const updatedServer = optionallyReplaceLocalhost(
            server,
            config.scanRuntime,
            config.docker.replaceLocalhost,
            config.platform
          );

          const [serialized, error] = serialize(oas, playbook);
          if (error !== undefined) {
            console.log("failed to serialize", error);
            // FIXME show error when serializing
            return;
          }

          dispatch(
            runScan({
              path: operation.request.request.path,
              method: operation.request.request.method,
              operationId,
              env: {
                SCAN42C_HOST: updatedServer,
                ...simple,
              },
              scanconf: extractScanconf(serialized, operationId),
            })
          );
        }}
      />

      <Header>
        <Title>{operationId}</Title>
        <div>
          <Method>{operation.request.request.method}</Method>
          <Path>{operation.request.request.path}</Path>
        </div>
      </Header>

      <CollapsibleSection
        defaultOpen={false}
        title="Authorization Tests"
        count={operation.authorizationTests.length}
      >
        <Content>
          <AuthorizationTests
            authorizationTests={operation.authorizationTests}
            removeTest={(test) => {
              const updated = operation.authorizationTests.filter((existing) => existing !== test);
              dispatch(
                actions.updateOperationAuthorizationTests({
                  operationId,
                  authorizationTests: updated,
                })
              );
            }}
          />

          <AddAuthorizationTest
            authorizationTests={playbook.authorizationTests}
            existing={operation.authorizationTests}
            auth={operation.request.auth}
            credentials={playbook.authenticationDetails[0]}
            onSelect={(selected) => {
              dispatch(
                actions.updateOperationAuthorizationTests({
                  operationId,
                  authorizationTests: [...operation.authorizationTests, selected],
                })
              );
            }}
          />
        </Content>
      </CollapsibleSection>

      <CollapsibleSection defaultOpen={false} title="Before" count={operation.before?.length}>
        <Content>
          <Scenario
            oas={oas}
            stages={operation.before as Playbook.StageReference[]}
            container={{ container: "operationBefore", operationId }}
            executionResult={findResult(mockResult, "operationBefore")}
            saveStage={saveStage}
            moveStage={moveStage}
            removeStage={removeStage}
            operations={playbook.operations}
            requests={playbook.requests}
          />
          <AddRequest
            operationIds={operationIds}
            requestIds={requestIds}
            onSelect={(selected) =>
              addStage({ container: "operationBefore", operationId }, selected)
            }
          />
        </Content>
      </CollapsibleSection>
      <CollapsibleSection title="Scenarios" count={operation.scenarios?.length}>
        <Scenarios operationId={operationId} />
      </CollapsibleSection>
      <CollapsibleSection defaultOpen={false} title="After" count={operation.after?.length}>
        <Content>
          <Scenario
            oas={oas}
            stages={operation.after as Playbook.StageReference[]}
            container={{ container: "operationAfter", operationId }}
            executionResult={findResult(mockResult, "operationAfter")}
            saveStage={saveStage}
            removeStage={removeStage}
            moveStage={moveStage}
            operations={playbook.operations}
            requests={playbook.requests}
          />
          <AddRequest
            operationIds={operationIds}
            requestIds={requestIds}
            onSelect={(selected) =>
              addStage({ container: "operationAfter", operationId }, selected)
            }
          />
        </Content>
      </CollapsibleSection>

      {tryResult.length > 0 && (
        <CollapsibleSection title="Result">
          <Execution result={tryResult} collapsible />
        </CollapsibleSection>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Header = styled.div`
  margin-bottom: 16px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  > div:last-child {
    display: flex;
    gap: 4px;
  }
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 700;
`;

const Method = styled.div`
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 16px;
  text-transform: uppercase;
  font-size: 11px;
`;

const Path = styled.div``;
