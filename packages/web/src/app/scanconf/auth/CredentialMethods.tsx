import * as Tabs from "@radix-ui/react-tabs";
import * as playbook from "@xliic/common/playbook";
import styled from "styled-components";
import { TabContainer } from "../../../new-components/Tabs";
import Scenario from "../operations/Scenario";
import AddRequest from "../operations/components/AddRequest";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { EllipsisVertical, Plus } from "../../../icons";
import { ThemeColorVariables } from "@xliic/common/theme";
import { unwrapCredential, wrapCredential } from "./form";
import Form from "../../../new-components/Form";
import Input from "../../../components/Input";
import { Menu, MenuItem } from "../../../new-components/Menu";

export default function CredentialMethods({
  credential,
  group,
  credentialId,
  saveCredential,
}: {
  group: number;
  credentialId: string;
  credential: playbook.Credential;
  saveCredential: (credential: playbook.Credential) => void;
}) {
  const dispatch = useAppDispatch();

  const { playbook, oas, selectedSubcredential } = useAppSelector((state) => state.scanconf);
  const { mockResult } = useAppSelector((state) => state.auth);

  const methods = Object.keys(credential.methods || {});

  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

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

  const tabs = methods.map((method, index) => {
    return {
      id: method,
      title: method,
      menu: (
        <Menu>
          <MenuItem onSelect={() => undefined}>Delete</MenuItem>
        </Menu>
      ),
      content: (
        <>
          <Form
            data={credential}
            saveData={saveCredential}
            wrapFormData={wrapCredential}
            unwrapFormData={unwrapCredential}
          >
            <div>.</div>
            <Input label="Credential value" name={`methods.${index}.value.credential`} />
          </Form>
          <Requests key={method} value={method}>
            <Scenario
              oas={oas}
              stages={credential.methods[method].requests as playbook.StageReference[]}
              container={{
                container: "credential",
                group: group,
                credentialId,
                subCredentialId: method,
              }}
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
              onSelect={(selected) =>
                addStage(
                  { container: "credential", group, credentialId, subCredentialId: method },
                  selected
                )
              }
            />
          </Requests>
        </>
      ),
    };
  });

  return (
    <TabContainer
      activeTab={selectedSubcredential}
      setActiveTab={(tab: string) => dispatch(actions.selectSubcredential(tab))}
      tabs={tabs}
      menu={
        <AddRequestButton>
          <Plus />
        </AddRequestButton>
      }
    />
  );
}

const Requests = styled(Tabs.Content)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
`;

const AddRequestButton = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
    &:hover {
      fill: var(${ThemeColorVariables.linkActiveForeground});
    }
  }
`;
