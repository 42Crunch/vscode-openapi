import { HttpRequest as HttpRequestType } from "@xliic/common/http";
import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import CollapsibleCard, { BottomDescription, TopDescription } from "../CollapsibleCard";
import { TabContainer } from "../../../../new-components/Tabs";
import Body from "./Body";
import Headers from "./Headers";

export default function HttpRequest({
  operationId,
  request,
  defaultCollapsed,
}: {
  operationId?: string;
  request: HttpRequestType;
  defaultCollapsed?: boolean;
}) {
  return (
    <Container>
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <BottomDescription>
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
                  <Body body={request.body} />
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

const Padding = styled.div`
  padding: 8px;
`;
