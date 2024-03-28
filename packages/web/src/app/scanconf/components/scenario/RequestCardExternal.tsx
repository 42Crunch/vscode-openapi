import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import Form from "../../../../new-components/Form";
import { TabContainer } from "../../../../new-components/Tabs";
import JsonEditor from "../../../../new-components/fields/JsonEditor";
import LineEditor from "../../../../new-components/fields/LineEditor";
import CollapsibleCard, {
  BottomDescription,
  TopDescription,
} from "../../../../new-components/CollapsibleCard";
import ResponseProcessing from "../operation/ResponseProcessing";
import ExternalParameters from "./ExternalParameters";
import { unwrapExternalPlaybookRequest, wrapExternalPlaybookRequest } from "./util";
import DownshiftSelect from "../../../../new-components/fields/DownshiftSelect";

export default function RequestCardExternal({
  requestRef,
  stage,
  saveRequest,
  defaultCollapsed,
  variables,
}: {
  requestRef: Playbook.RequestRef;
  stage: Playbook.ExternalStageContent;
  saveRequest: (request: Playbook.ExternalStageContent) => void;
  defaultCollapsed?: boolean;
  variables: string[];
}) {
  const responseCodeOptions = getResponseCodeOptions(stage);

  return (
    <Container>
      <Form
        data={stage}
        saveData={saveRequest}
        wrapFormData={wrapExternalPlaybookRequest}
        unwrapFormData={unwrapExternalPlaybookRequest}
      >
        <CollapsibleCard defaultCollapsed={defaultCollapsed}>
          <TopDescription>
            <span>{requestRef.id}</span>
            <DefaultResponse>
              <span>Default Response</span>
              <DownshiftSelect name="defaultResponse" options={responseCodeOptions} />
            </DefaultResponse>
          </TopDescription>
          <BottomDescription>
            <Method>{stage.request.method}</Method>
            <Url onClick={(e) => e.stopPropagation()}>
              <LineEditor variables={variables} name="url" />
            </Url>
          </BottomDescription>
          <Request stage={stage} variables={variables} />
        </CollapsibleCard>
      </Form>
    </Container>
  );
}

export function Request({
  stage,
  variables,
}: {
  stage: Playbook.ExternalStageContent;
  variables: string[];
}) {
  return (
    <Container>
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
            content: <ResponseProcessing editable responseCodes={httpResponseCodes} />,
          },
        ]}
      />
    </Container>
  );
}

function getResponseCodeOptions(stage: Playbook.ExternalStageContent) {
  return Object.keys(stage.responses || {}).map((key) => ({ label: key, value: key }));
}

const httpResponseCodes = [
  "100",
  "101",
  "200",
  "201",
  "202",
  "203",
  "204",
  "205",
  "206",
  "300",
  "301",
  "302",
  "303",
  "304",
  "305",
  "307",
  "400",
  "401",
  "402",
  "403",
  "404",
  "405",
  "406",
  "407",
  "408",
  "409",
  "410",
  "411",
  "412",
  "413",
  "414",
  "415",
  "416",
  "417",
  "426",
  "500",
  "501",
  "502",
  "503",
  "504",
  "505",
];

const Container = styled.div`
  > div {
    background-color: var(${ThemeColorVariables.background});
  }
`;

const Url = styled.div`
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
  width: 48px;
  height: 16px;
  text-transform: uppercase;
  font-size: 11px;
`;

const DefaultResponse = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  font-weight: 400;
  flex: 1;
  justify-content: end;
  > div {
    width: 80px;
    border: 1px solid var(${ThemeColorVariables.border});
  }
`;
