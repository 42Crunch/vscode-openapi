import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";

import { wrapPlaybookRequest, unwrapPlaybookRequest } from "./util";

import CollapsibleCard, { BottomDescription, BottomItem, TopDescription } from "../CollapsibleCard";
import Operation from "../operation/Operation";
import Form from "../../../../new-components/Form";

export default function OperationCard({
  location,
  operation,
  oas,
  credentials,
  saveRequest,
}: {
  location: playbook.StageLocation;
  operation: playbook.Operation;
  oas: BundledSwaggerOrOasSpec;
  credentials: playbook.Credentials;
  saveRequest: (operationId: string, request: playbook.StageContent) => void;
}) {
  return (
    <Container>
      <CollapsibleCard>
        <TopDescription>
          <Method>{operation.request.request.method}</Method>
          <Path>{operation.request.request.path}</Path>
        </TopDescription>
        <BottomDescription>
          <BottomItem>OperationId: {operation.operationId}</BottomItem>
        </BottomDescription>
        <Request
          operationId={operation.operationId}
          oas={oas}
          credentials={credentials}
          request={operation.request}
          saveRequest={saveRequest}
        />
      </CollapsibleCard>
    </Container>
  );
}

export function Request({
  request,
  operationId,
  oas,
  credentials,
  saveRequest,
}: {
  request: playbook.StageContent;
  operationId: string;
  oas: BundledSwaggerOrOasSpec;
  credentials: playbook.Credentials;
  saveRequest: (operationId: string, request: playbook.StageContent) => void;
}) {
  const save = (request: playbook.StageContent) => saveRequest(operationId, request);
  return (
    <Form
      data={request}
      saveData={save}
      wrapFormData={wrapPlaybookRequest}
      unwrapFormData={unwrapPlaybookRequest}
    >
      <Operation
        oas={oas}
        credentials={credentials}
        method={request.request.method}
        path={request.request.path}
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
