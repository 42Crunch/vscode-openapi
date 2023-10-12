import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import Form from "../../../../new-components/Form";
import { TabContainer } from "../../../../new-components/Tabs";
import JsonEditor from "../../../../new-components/fields/JsonEditor";
import CollapsibleCard, { BottomDescription, TopDescription } from "../CollapsibleCard";
import { unwrapExternalPlaybookRequest, wrapExternalPlaybookRequest } from "./util";

export default function RequestCardExternal({
  requestRef,
  stage,
  saveRequest,
  defaultCollapsed,
  variables,
}: {
  requestRef: playbook.RequestRef;
  stage: playbook.ExternalStageContent;
  saveRequest: (request: playbook.ExternalStageContent) => void;
  defaultCollapsed?: boolean;
  variables: string[];
}) {
  return (
    <Container>
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <TopDescription>{requestRef.id}</TopDescription>
        <BottomDescription>
          <Method>{stage.request.method}</Method>
          <Path>{stage.request.url}</Path>
        </BottomDescription>
        <Request stage={stage} saveRequest={saveRequest} variables={variables} />
      </CollapsibleCard>
    </Container>
  );
}

export function Request({
  stage,
  saveRequest,
  variables,
}: {
  stage: playbook.ExternalStageContent;
  saveRequest: (request: playbook.ExternalStageContent) => void;
  variables: string[];
}) {
  return (
    <Form
      data={stage}
      saveData={saveRequest}
      wrapFormData={wrapExternalPlaybookRequest}
      unwrapFormData={unwrapExternalPlaybookRequest}
    >
      <TabContainer
        tabs={[
          {
            id: "body",
            title: "Body",
            content: <JsonEditor variables={variables} name={"body.value"} />,
          },
        ]}
      />
    </Form>
  );
}

const Container = styled.div``;

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
