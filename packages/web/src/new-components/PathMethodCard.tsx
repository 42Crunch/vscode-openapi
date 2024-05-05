import styled from "styled-components";

import { HttpMethod } from "@xliic/openapi";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Link } from "../icons";

export default function PathMethodCard({
  path,
  method,
  operationId,
  children,
}: {
  operationId?: string;
  path: string;
  method: HttpMethod;
  children?: React.ReactNode;
}) {
  return (
    <Container>
      {operationId && (
        <Title>
          {operationId}
          <Link />
        </Title>
      )}
      <MethodAndPath>
        <Method>{method}</Method>
        <Path>{path}</Path>
      </MethodAndPath>
      {children}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-break: anywhere;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;

const MethodAndPath = styled.div`
  display: flex;
  gap: 4px;
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
