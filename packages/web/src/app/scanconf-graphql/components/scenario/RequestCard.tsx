import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import CollapsibleCard, {
  BottomDescription,
  TopDescription,
} from "../../../../new-components/CollapsibleCard";
import Form from "../../../../new-components/Form";
import OperationTabs from "../operation/OperationTabs";
import { wrapPlaybookRequest } from "./util";
import { unwrapPlaybookRequest } from "../../../scanconf/components/scenario/util";

export default function RequestCard({
  config,
  requestRef,
  stage,
  credentials,
  saveRequest,
  defaultCollapsed,
  availableVariables,
}: {
  config: any;
  requestRef: Playbook.RequestRef;
  credentials: Playbook.Credentials | undefined;
  stage: any;
  saveRequest: (request: Playbook.StageContent) => void;
  defaultCollapsed?: boolean;
  availableVariables: string[];
}) {
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
          </TopDescription>
          <BottomDescription>
            <Method>{stage.request.method}</Method>
            <Path>{stage.request.path}</Path>
          </BottomDescription>
          <OperationTabs
            config={config}
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
