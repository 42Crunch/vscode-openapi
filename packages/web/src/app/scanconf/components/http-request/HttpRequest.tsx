import styled from "styled-components";

import { HttpRequest as HttpRequestType } from "@xliic/common/http";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import { ArrowRightFromBracket } from "../../../../icons";
import { TabContainer } from "../../../../new-components/Tabs";
import CollapsibleCard, { BottomDescription } from "../../../../new-components/CollapsibleCard";
import Body from "./Body";
import Headers from "./Headers";

export default function HttpRequest({
  operationId,
  request,
  defaultCollapsed,
  requestRef,
  statusCode,
}: {
  operationId?: string;
  request: HttpRequestType;
  defaultCollapsed?: boolean;
  requestRef?: Playbook.RequestRef;
  statusCode?: number;
}) {
  return (
    <Container>
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <BottomDescription style={{ gap: "8px" }}>
          <ArrowRightFromBracket
            style={{
              width: 14,
              minWidth: 14,
              height: 14,
              minHeight: 14,
              fill: `var(${ThemeColorVariables.foreground})`,
            }}
          />
          <Method>{request.method}</Method>
          <Path>{request.url}</Path>
        </BottomDescription>
        <TabContainer
          tabs={[
            {
              id: "body",
              title: "Body",
              content: (
                <Padding>
                  <Body request={request} requestRef={requestRef} statusCode={statusCode} />
                </Padding>
              ),
              disabled: request.body === undefined,
            },
            {
              id: "headers",
              title: "Headers",
              content: (
                <Padding>
                  <Headers headers={request.headers} />
                </Padding>
              ),
            },
          ]}
        />
      </CollapsibleCard>
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
  min-width: 48px;
  height: 16px;
  min-height: 16px;
  text-transform: uppercase;
  font-size: 11px;
`;

const Path = styled.div`
  line-break: anywhere;
`;

const Padding = styled.div`
  padding: 8px;
`;
