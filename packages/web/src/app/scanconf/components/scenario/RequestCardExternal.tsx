import styled from "styled-components";

import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";

import Form from "../../../../new-components/Form";
import { TabContainer } from "../../../../new-components/Tabs";
import JsonEditor from "../../../../new-components/fields/JsonEditor";
import LineEditor from "../../../../new-components/fields/LineEditor";
import CollapsibleCard, { TopDescription } from "../CollapsibleCard";
import ResponseProcessing from "../operation/ResponseProcessing";
import ExternalParameters from "./ExternalParameters";
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
      <Container>
        <Top>
          <Method>{stage.request.method}</Method>
          <Url variables={variables} name="url" />
        </Top>
        <TabContainer
          tabs={[
            {
              id: "body",
              title: "Body",
              content: <JsonEditor variables={variables} name={"body.value"} />,
              disabled: stage.request.body === undefined,
            },
            {
              id: "query",
              title: "Query",
              content: <ExternalParameters name={"parameters.query"} variables={variables} />,
            },
            {
              id: "header",
              title: "Headers",
              content: <ExternalParameters name={"parameters.header"} variables={variables} />,
            },
            {
              id: "responses",
              title: "Response processing",
              content: <ResponseProcessing />,
            },
          ]}
        />
      </Container>
    </Form>
  );
}

const Container = styled.div`
  > div {
    background-color: var(${ThemeColorVariables.background});
  }
`;

const Top = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px;
  > select {
    padding-left: 4px;
    padding-right: 4px;
    border: none;
    background-color: var(${ThemeColorVariables.badgeBackground});
    border-radius: 4px;
    color: var(${ThemeColorVariables.badgeForeground});
    width: 100px;
  }
`;

const Url = styled(LineEditor)`
  flex: 1;
  background-color: var(${ThemeColorVariables.background});
  border: 1px solid var(${ThemeColorVariables.border});
`;

const Method = styled.div`
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100px;
  height: 24px;
  text-transform: uppercase;
`;
