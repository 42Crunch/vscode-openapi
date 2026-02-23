import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { OpenApi30, OpenApi31, Swagger } from "@xliic/openapi";

export type Parameter =
  | OpenApi31.ResolvedParameter
  | OpenApi30.ResolvedParameter
  | Swagger.ResolvedParameter;

export type Schema = { type?: string | string[] };

export default function ParameterRow({ name, value }: { name: string; value: string }) {
  return (
    <Container>
      <Name>{name}</Name>
      <Value>{value}</Value>
      <div></div>
    </Container>
  );
}

const Value = styled.div`
  flex: 1;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  margin-right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Container = styled.div`
  display: contents;
  &:hover > :last-child {
    opacity: 1;
  }
`;

const Name = styled.div`
  flex: 1;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  margin-right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
`;
