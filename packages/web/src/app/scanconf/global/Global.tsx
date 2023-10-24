import styled from "styled-components";

import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";

import { SearchSidebarControlled, Section } from "../../../components/layout/SearchSidebar";
import { setTryitServer } from "../../../features/prefs/slice";
import CollapsibleSection from "../components/CollapsibleSection";
import Scenario from "../operations/Scenario";
import AddRequest from "../operations/components/AddRequest";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import TryIt from "./TryIt";
import { selectGlobal, startTryGlobal } from "./slice";
import Execution from "../components/execution/Execution";

export default function Global() {
  const dispatch = useAppDispatch();

  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);
  const { selected } = useAppSelector((state) => state.global);
  const { tryResult, mockResult } = useAppSelector((state) => state.global);
  const prefs = useAppSelector((state) => state.prefs);

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
        },
      })
    );
  };

  const server = getPreferredServer(oas, prefs.tryitServer);

  const setServer = (server: string) => dispatch(setTryitServer(server));

  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

  const sections: Section[] = [
    {
      id: "general",
      title: "General",
      items: [
        { id: "before", label: "Before" },
        { id: "after", label: "After" },
      ],
    },
  ];

  return (
    <SearchSidebarControlled
      selected={{ sectionId: "general", itemId: selected }}
      onSelected={(itemId) => dispatch(selectGlobal(itemId.itemId as any))}
      noSectionTitles
      sections={sections}
      render={(item) => (
        <>
          {item?.itemId === "before" && (
            <Content key="before">
              <TryIt
                servers={servers}
                selected={server}
                onTry={(server: string) => {
                  dispatch(startTryGlobal(server));
                }}
                onChange={setServer}
              />
              <Scenario
                oas={oas}
                stages={playbook.before as playbook.StageReference[]}
                container={{ container: "globalBefore" }}
                executionResult={mockResult?.[0]}
                saveStage={saveStage}
                moveStage={moveStage}
                removeStage={removeStage}
                operations={playbook.operations}
                requests={playbook.requests}
              />
              <AddRequest
                operationIds={operationIds}
                requestIds={requestIds}
                onSelect={(selected) => addStage({ container: "globalBefore" }, selected)}
              />
              {tryResult.length > 0 && (
                <CollapsibleSection title="Result">
                  <Execution result={tryResult} />
                </CollapsibleSection>
              )}
            </Content>
          )}
          {item?.itemId === "after" && (
            <Content key="after">
              <TryIt
                servers={servers}
                selected={server}
                onTry={(server: string) => {
                  dispatch(startTryGlobal(server));
                }}
                onChange={setServer}
              />
              <Scenario
                oas={oas}
                stages={playbook.after as playbook.StageReference[]}
                container={{ container: "globalAfter" }}
                executionResult={undefined}
                saveStage={saveStage}
                removeStage={removeStage}
                moveStage={moveStage}
                operations={playbook.operations}
                requests={playbook.requests}
              />
              <AddRequest
                operationIds={operationIds}
                requestIds={requestIds}
                onSelect={(selected) => addStage({ container: "globalAfter" }, selected)}
              />
              {tryResult.length > 0 && (
                <CollapsibleSection title="Result">
                  <Execution result={tryResult} />
                </CollapsibleSection>
              )}
            </Content>
          )}
        </>
      )}
    />
  );
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
