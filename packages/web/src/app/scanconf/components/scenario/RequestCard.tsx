import styled from "styled-components";

import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";

import { unwrapPlaybookRequest, wrapPlaybookRequest } from "./util";
import CollapsibleCard, { BottomDescription, TopDescription } from "../CollapsibleCard";
import Operation from "../../components/operation/Operation";
import Form from "../../components/Form";

export default function RequestCard({
  oas,
  requestRef,
  stage,
  credentials,
  saveRequest,
  defaultCollapsed,
}: {
  oas: BundledSwaggerOrOasSpec;
  requestRef: playbook.RequestRef;
  credentials: playbook.Credentials;
  stage: playbook.StageContent;
  saveRequest: (request: playbook.StageContent) => void;
  defaultCollapsed?: boolean;
}) {
  return (
    <Container>
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <TopDescription>{requestRef.id}</TopDescription>
        <BottomDescription>
          <Method>{stage.request.method}</Method>
          <Path>{stage.request.path}</Path>
        </BottomDescription>
        <Request oas={oas} stage={stage} credentials={credentials} saveRequest={saveRequest} />
      </CollapsibleCard>
    </Container>
  );
}

export function Request({
  stage,
  oas,
  credentials,
  saveRequest,
}: {
  stage: playbook.StageContent;
  oas: BundledSwaggerOrOasSpec;
  credentials: playbook.Credentials;
  saveRequest: (request: playbook.StageContent) => void;
}) {
  return (
    <Form
      data={stage}
      saveData={saveRequest}
      wrapFormData={wrapPlaybookRequest}
      unwrapFormData={unwrapPlaybookRequest}
    >
      <Operation
        oas={oas}
        credentials={credentials}
        method={stage.request.method}
        path={stage.request.path}
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
