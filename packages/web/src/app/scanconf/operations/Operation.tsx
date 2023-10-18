import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import styled from "styled-components";
import { ErrorBanner } from "../../../components/Banner";
import Separator from "../../../components/Separator";
import { makeEnvEnv } from "../../../core/playbook/execute";
import { setTryitServer } from "../../../features/prefs/slice";
import { goTo } from "../../../features/router/slice";
import { runScan } from "../actions";
import CollapsibleSection from "../components/CollapsibleSection";
import Responses from "../components/scenario/Responses";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Scenario from "./Scenario";
import Scenarios from "./Scenarios";
import Servers from "./Servers";
import AddRequest from "./components/AddRequest";
import { startTryExecution } from "./slice";
import { findResult } from "../playbook-execution-handler";
import Execution from "../components/execution/Execution";

export default function Operation({ operationId }: { operationId: string }) {
  const dispatch = useAppDispatch();

  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);

  const { mockResult, tryResult } = useAppSelector((state) => state.operations);
  const env = useAppSelector((state) => state.env.data);

  const removeStage = (location: playbook.StageLocation) => dispatch(actions.removeStage(location));

  const saveStage = (location: playbook.StageLocation, stage: playbook.StageReference) =>
    dispatch(actions.saveOperationReference({ location, reference: stage }));

  const moveStage = (location: playbook.StageLocation, to: number) =>
    dispatch(actions.moveStage({ location, to }));

  const addStage = (container: playbook.StageContainer, ref: playbook.RequestRef) => {
    dispatch(
      actions.addStage({
        container,
        stage: {
          ref,
          credentialSetIndex: 0,
        },
      })
    );
  };

  const [isBeforeOpen, setBeforeOpen] = useState(false);
  const [isAfterOpen, setAfterOpen] = useState(false);
  const [isScenariosOpen, setScenariosOpen] = useState(true);
  const [isResultOpen, setResultOpen] = useState(true);

  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

  const setServer = (server: string) => dispatch(setTryitServer(server));

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.tryitServer);

  const [scanenv, scanenvError] = makeEnvEnv(playbook.environments["default"], env);

  const [hasTried, setHasTried] = useState(false);

  return (
    <Container>
      <Servers
        servers={servers}
        selected={server}
        onTry={(server: string) => {
          setHasTried(true);
          dispatch(startTryExecution(server));
        }}
        onScan={(server: string) => {
          setHasTried(true);
          if (scanenvError == undefined) {
            // FIXME display error if env variables are not available
            dispatch(
              runScan({
                path: playbook.operations[operationId].request.request.path,
                method: playbook.operations[operationId].request.request.method,
                operationId,
                env: {
                  SCAN42C_HOST: server,
                  ...scanenv[1],
                },
              })
            );
          }
        }}
        onChange={setServer}
      />
      {scanenvError && hasTried && (
        <ErrorBanner
          message={"Please set required environment variables: " + scanenvError.join(", ")}
        >
          <GoTo
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              dispatch(goTo(["environments"]));
            }}
          >
            Go to "Environment" tab
          </GoTo>
        </ErrorBanner>
      )}
      <Header>
        <Title>{operationId}</Title>
      </Header>
      <CollapsibleSection
        isOpen={isBeforeOpen}
        onClick={(e) => {
          setBeforeOpen(!isBeforeOpen);
        }}
        title="Before"
        count={playbook.operations[operationId]?.before?.length}
      >
        <Content>
          <Scenario
            oas={oas}
            stages={playbook.operations[operationId].before as playbook.StageReference[]}
            container={{ container: "operationBefore", operationId }}
            executionResult={findResult(mockResult, "operationBefore")}
            saveStage={saveStage}
            moveStage={moveStage}
            removeStage={removeStage}
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
      <CollapsibleSection
        isOpen={isScenariosOpen}
        onClick={(e) => {
          setScenariosOpen(!isScenariosOpen);
        }}
        title="Scenarios"
        count={playbook.operations[operationId]?.scenarios?.length}
      >
        <Scenarios operationId={operationId} />
      </CollapsibleSection>
      <CollapsibleSection
        isOpen={isAfterOpen}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAfterOpen(!isAfterOpen);
        }}
        title="After"
        count={playbook.operations[operationId]?.after?.length}
      >
        <Content>
          <Scenario
            oas={oas}
            stages={playbook.operations[operationId].after as playbook.StageReference[]}
            container={{ container: "operationAfter", operationId }}
            executionResult={findResult(mockResult, "operationAfter")}
            saveStage={saveStage}
            removeStage={removeStage}
            moveStage={moveStage}
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
        <CollapsibleSection
          isOpen={isResultOpen}
          onClick={() => setResultOpen(!isResultOpen)}
          title="Result"
        >
          <Execution result={tryResult} />
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
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  > div:first-child {
    flex: 1;
  }
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 700;
`;

const Action = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  cusror: pointer;
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;

const GoTo = styled.div`
  color: var(${ThemeColorVariables.linkForeground});
  &:hover {
    color: var(${ThemeColorVariables.linkActiveForeground});
  }
  cursor: pointer;
  & > svg {
    width: 10px;
    height: 10px;
  }
`;

function getPreferredServer(
  oas: BundledSwaggerOrOasSpec,
  preferredServer: string | undefined
): string {
  const servers = getServerUrls(oas);

  const exists = servers.some((url) => url === preferredServer);
  if (preferredServer !== undefined && preferredServer !== "" && exists) {
    return preferredServer;
  }
  return servers[0];
}
