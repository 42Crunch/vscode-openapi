import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";

import { useState } from "react";
import { FileExport, Play } from "../../../icons";
import CollapsibleSection from "../components/CollapsibleSection";
import { useAppDispatch, useAppSelector } from "../store";
import Scenario from "./Scenario";
import Scenarios from "./Scenarios";
import AddRequest from "./components/AddRequest";
import * as actions from "../slice";
import { startTryExecution } from "./slice";
import Servers from "./Servers";
import { setTryitServer } from "../../../features/prefs/slice";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import Responses from "../components/scenario/Responses";
import Separator from "../../../components/Separator";
import { runScan } from "../actions";
import { makeEnvEnv } from "../../../core/playbook/execute";

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

  const setServer = (server: string) => dispatch(setTryitServer(server));

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.tryitServer);

  const [scanenv, scanenvError] = makeEnvEnv(playbook.environments["default"], env);

  console.log("scanenv", scanenv);

  return (
    <Container>
      <Servers
        servers={servers}
        selected={server}
        onTry={(server: string) => dispatch(startTryExecution(server))}
        onScan={(server: string) => {
          if (scanenvError == undefined) {
            dispatch(
              runScan({
                path: "foo",
                method: "get",
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
        <Scenario
          oas={oas}
          stages={playbook.operations[operationId].before}
          container={{ container: "operationBefore", operationId }}
          executionResult={mockResult.operationBefore}
          saveStage={saveStage}
          moveStage={moveStage}
          removeStage={removeStage}
        />
        <AddRequest
          operationIds={operationIds}
          onSelect={(selected) => addStage({ container: "operationBefore", operationId }, selected)}
        />
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
        <Scenario
          oas={oas}
          stages={playbook.operations[operationId].after}
          container={{ container: "operationAfter", operationId }}
          executionResult={mockResult.operationAfter}
          saveStage={saveStage}
          removeStage={removeStage}
          moveStage={moveStage}
        />
        <AddRequest
          operationIds={operationIds}
          onSelect={(selected) => addStage({ container: "operationAfter", operationId }, selected)}
        />
      </CollapsibleSection>

      <CollapsibleSection
        isOpen={isResultOpen}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setResultOpen(!isResultOpen);
        }}
        title="Result"
      >
        {tryResult.globalBefore.results.length > 0 && (
          <>
            <Separator title="Global before" />
            <Responses result={tryResult.globalBefore} />
          </>
        )}
        {tryResult.operationBefore.results.length > 0 && (
          <>
            <Separator title="Before" />
            <Responses result={tryResult.operationBefore} />
          </>
        )}
        {tryResult.operationScenarios.results.length > 0 && (
          <>
            <Separator title="Scenario" />
            <Responses result={tryResult.operationScenarios} />
          </>
        )}
        {tryResult.operationAfter.results.length > 0 && (
          <>
            <Separator title="After" />
            <Responses result={tryResult.operationAfter} />
          </>
        )}
        {tryResult.globalAfter.results.length > 0 && (
          <>
            <Separator title="Global after" />
            <Responses result={tryResult.globalAfter} />
          </>
        )}
      </CollapsibleSection>
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
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
