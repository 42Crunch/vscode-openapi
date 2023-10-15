import * as Tabs from "@radix-ui/react-tabs";
import * as playbook from "@xliic/common/playbook";
import styled from "styled-components";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { TabButton, TabList } from "../../../new-components/Tabs";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import Scenario from "../operations/Scenario";
import AddRequest from "../operations/components/AddRequest";

export default function CredentialMethods({
  group,
  credentialId,
  credential,
}: {
  group: number;
  credentialId: string;
  credential: playbook.Credential;
}) {
  const dispatch = useAppDispatch();

  const { playbook, oas } = useAppSelector((state) => state.scanconf);
  // const { scenarioId, mockResult: result } = useAppSelector((state) => state.operations);
  // const scenarios = playbook.operations[operationId].scenarios;
  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

  const methods = Object.keys(credential.methods).sort();
  const [method, setMethod] = useState(methods[0]);

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

  return (
    <Tabs.Root value={method} onValueChange={(value) => setMethod(value)}>
      <TabList>
        {methods.map((method) => (
          <TabButton key={method} value={method}>
            {method}
          </TabButton>
        ))}
        <Controls>
          <Menu>
            <MenuItem onSelect={() => undefined}>Delete</MenuItem>
          </Menu>
        </Controls>
      </TabList>
      {methods.map((method) => (
        <TabsContent key={method} value={method}>
          <Scenario
            oas={oas}
            stages={credential.methods[method].requests}
            container={{ container: "credential", group, credentialId, subCredentialId: method }}
            executionResult={undefined}
            saveStage={saveStage}
            moveStage={moveStage}
            removeStage={removeStage}
          />
          <AddRequest
            operationIds={operationIds}
            requestIds={requestIds}
            onSelect={(selected) =>
              addStage(
                { container: "credential", group, credentialId, subCredentialId: method },
                selected
              )
            }
          />
        </TabsContent>
      ))}
    </Tabs.Root>
  );
}

const TabsContent = styled(Tabs.Content)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
`;

const Controls = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;
