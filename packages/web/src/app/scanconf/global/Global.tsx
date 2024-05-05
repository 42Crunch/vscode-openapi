import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";

import { SearchSidebarControlled, Section } from "../../../components/layout/SearchSidebar";
import CollapsibleSection from "../components/CollapsibleSection";
import Scenario from "../operations/Scenario";
import AddRequest from "../operations/AddRequest";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { selectGlobal, startTryGlobal } from "./slice";
import Execution from "../components/execution/Execution";
import TryAndServerSelector from "../components/TryAndServerSelector";
import { setRequestId } from "../requests/slice";
import { goTo } from "../../../features/router/slice";

export default function Global() {
  const dispatch = useAppDispatch();

  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);
  const { selected } = useAppSelector((state) => state.global);
  const { tryResult, mockResult } = useAppSelector((state) => state.global);

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

  const goToRequest = (req: Playbook.RequestRef) => {
    // FIXME, order is important
    // need to move setRequestId functionality to the router
    dispatch(setRequestId(req));
    dispatch(goTo(["scanconf", "requests"]));
  };

  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

  const sections: Section[] = [
    {
      id: "general",
      title: "General",
      items: [
        { id: "before", label: "Global Before" },
        { id: "after", label: "Global After" },
      ],
    },
  ];

  return (
    <SearchSidebarControlled
      title="items"
      selected={{ sectionId: "general", itemId: selected }}
      onSelected={(itemId) => dispatch(selectGlobal(itemId.itemId as any))}
      noSectionTitles
      sections={sections}
      render={(item) => (
        <>
          {item?.itemId === "before" && (
            <Content key="before">
              <TryAndServerSelector
                servers={servers}
                onTry={(server: string) => {
                  dispatch(startTryGlobal(server));
                }}
              />
              <Scenario
                oas={oas}
                stages={playbook.before as Playbook.StageReference[]}
                container={{ container: "globalBefore" }}
                executionResult={mockResult?.[0]}
                saveStage={saveStage}
                moveStage={moveStage}
                removeStage={removeStage}
                operations={playbook.operations}
                requests={playbook.requests}
                goToRequest={goToRequest}
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
              <TryAndServerSelector
                servers={servers}
                onTry={(server: string) => {
                  dispatch(startTryGlobal(server));
                }}
              />
              <Scenario
                oas={oas}
                stages={playbook.after as Playbook.StageReference[]}
                container={{ container: "globalAfter" }}
                executionResult={undefined}
                saveStage={saveStage}
                removeStage={removeStage}
                moveStage={moveStage}
                operations={playbook.operations}
                requests={playbook.requests}
                goToRequest={goToRequest}
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
  padding: 8px;
`;
