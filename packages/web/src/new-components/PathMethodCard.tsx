import styled from "styled-components";

import { HttpMethod } from "@xliic/openapi";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function PathMethodCard({
  path,
  method,
  operationId,
}: {
  operationId?: string;
  path: string;
  method: HttpMethod;
}) {
  return (
    <Container>
      {operationId && <Title>{operationId}</Title>}
      <div>
        <Method>{method}</Method>
        <Path>{path}</Path>
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  > div:last-child {
    display: flex;
    gap: 4px;
  }
  line-break: anywhere;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
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
