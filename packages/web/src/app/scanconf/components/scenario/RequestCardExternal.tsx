import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { HttpMethods } from "@xliic/common/http";
import styled from "styled-components";
import Form from "../../../../new-components/Form";
import { TabContainer } from "../../../../new-components/Tabs";
import JsonEditor from "../../../../new-components/fields/JsonEditor";
import CollapsibleCard, { BottomDescription, TopDescription } from "../CollapsibleCard";
import { unwrapExternalPlaybookRequest, wrapExternalPlaybookRequest } from "./util";
import LineEditor from "../../../../new-components/fields/LineEditor";
import Select from "../../../../new-components/fields/Select";

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
  const methods = HttpMethods.map((method) => ({ value: method, label: method.toUpperCase() }));

  return (
    <Form
      data={stage}
      saveData={saveRequest}
      wrapFormData={wrapExternalPlaybookRequest}
      unwrapFormData={unwrapExternalPlaybookRequest}
    >
      <Container>
        <Top>
          <Select options={methods} name="method" />
          <Url variables={variables} name="url" />
        </Top>
        <TabContainer
          tabs={[
            {
              id: "body",
              title: "Body",
              content: <JsonEditor variables={variables} name={"body.value"} />,
            },
          ]}
        />
      </Container>
    </Form>
  );
}

const Container = styled.div``;

const Top = styled.div`
  display: flex;
  gap: 4px;
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
