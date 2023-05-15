import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { CircleInfo } from "../../icons";

export default function NoReport() {
  return (
    <Container>
      <CircleInfo />
      There is no Security Audit report available for this file
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  margin: 8px;
  padding: 8px;
  gap: 8px;
  align-items: center;
  border: 1px solid var(${ThemeColorVariables.border});
  font-size: 14px;
  > svg {
    color: var(${ThemeColorVariables.foreground});
  }
`;
