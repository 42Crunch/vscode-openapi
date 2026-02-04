import * as Tabs from "@radix-ui/react-tabs";
import { Playbook } from "@xliic/scanconf";
import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";
import Input from "../../../components/Input";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { TabContainer } from "../../../new-components/Tabs";
import Scenario from "../operations/Scenario";
import AddRequest from "../operations/AddRequest";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import NewValueDialog from "./NewValueDialog";
import { TrashCan } from "../../../icons";
import { setRequestId } from "../requests/slice";
import { goTo } from "../../../features/router/slice";

export default function CredentialValues({
  group,
  credentialId,
}: {
  group: number;
  credentialId: string;
}) {
  const dispatch = useAppDispatch();

  const { playbook, oas, selectedSubcredential } = useAppSelector((state) => state.scanconf);
  const { mockResult } = useAppSelector((state) => state.auth);

  const operationIds = Object.keys(playbook.operations);
  const requestIds = Object.keys(playbook.requests || {});

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

  const { fields, append, remove } = useFieldArray({
    name: "methods",
  });

  const { getValues } = useFormContext();

  const tabs = fields.map((method: any, index) => {
    return {
      id: method.key,
      title: method.key,
      menu: (
        <Menu>
          <MenuItem onClick={(e) => e.stopPropagation()} onSelect={() => remove(index)}>
            <TrashCan />
            Delete
          </MenuItem>
        </Menu>
      ),
      content: (
        <Content value={method.key}>
          <Input label="Credential value" name={`methods.${index}.value.credential`} />
          <Requests>
            <Scenario
              oas={oas}
              stages={method.value.requests as Playbook.StageReference[]}
              container={{
                container: "credential",
                group: group,
                credentialId,
                subCredentialId: method.key,
              }}
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
              onSelect={(selected) =>
                addStage(
                  { container: "credential", group, credentialId, subCredentialId: method.key },
                  selected
                )
              }
            />
          </Requests>
        </Content>
      ),
    };
  });

  return (
    <TabContainer
      activeTab={selectedSubcredential}
      setActiveTab={(tab: string) => dispatch(actions.selectSubcredential(tab))}
      tabs={tabs}
      menu={
        <NewValueDialog
          existing={getValues("methods").map((value: any) => value.key as string)}
          onAddCredentialValue={(name: string, value: Playbook.CredentialMethod) => {
            append({ key: name, value: value });
            dispatch(actions.selectSubcredential(name));
          }}
        />
      }
    />
  );
}

const Content = styled(Tabs.Content)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
`;

const Requests = styled.div`
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
