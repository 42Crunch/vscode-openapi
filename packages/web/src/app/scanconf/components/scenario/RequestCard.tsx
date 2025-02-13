import styled from "styled-components";

import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import { unwrapPlaybookRequest, wrapPlaybookRequest } from "./util";
import CollapsibleCard, {
  BottomDescription,
  TopDescription,
} from "../../../../new-components/CollapsibleCard";
import Form from "../../../../new-components/Form";
import OperationTabs from "../operation/OperationTabs";
import DownshiftSelect from "../../../../new-components/fields/DownshiftSelect";

export default function RequestCard({
  oas,
  requestRef,
  stage,
  credentials,
  saveRequest,
  defaultCollapsed,
  availableVariables,
}: {
  oas: BundledSwaggerOrOasSpec;
  requestRef: Playbook.RequestRef;
  credentials: Playbook.Credentials;
  stage: Playbook.StageContent;
  saveRequest: (request: Playbook.StageContent) => void;
  defaultCollapsed?: boolean;
  availableVariables: string[];
}) {
  const responseCodeOptions = getResponseCodeOptions(stage);

  return (
    <Container>
      <Form
        data={stage}
        saveData={saveRequest}
        wrapFormData={wrapPlaybookRequest}
        unwrapFormData={unwrapPlaybookRequest}
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
            <Path>{stage.request.path}</Path>
          </BottomDescription>
          <OperationTabs
            oas={oas}
            credentials={credentials}
            method={stage.request.method}
            path={stage.request.path}
            availableVariables={availableVariables}
          />
        </CollapsibleCard>
      </Form>
    </Container>
  );
}

function getResponseCodeOptions(stage: Playbook.StageContent) {
  return Object.keys(stage.responses || {}).map((key) => ({ label: key, value: key }));
}

const Container = styled.div`
  > div {
    background-color: var(${ThemeColorVariables.background});
  }
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

const Path = styled.div``;

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
