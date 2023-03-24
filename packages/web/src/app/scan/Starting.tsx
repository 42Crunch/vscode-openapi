import styled, { keyframes } from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function Starting() {
  return (
    <Container>
      <Top />
      <Bottom />
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
  display: flex;
  flex-flow: column;
  gap: 8px;
`;

const flashing = keyframes`
  0% {
    background-color: var(${ThemeColorVariables.computedOne});
  }
  100% {
    background-color: var(${ThemeColorVariables.computedTwo});
  }
`;

const Top = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  height: 2.1rem;
  animation: ${flashing} 1s linear infinite alternate;
`;

const Bottom = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  height: 15rem;
  animation: ${flashing} 1s linear infinite alternate;
`;
