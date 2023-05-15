import styled, { keyframes } from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function Loading() {
  return (
    <Container>
      <Tiles>
        <div />
        <div />
        <div />
      </Tiles>
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

const Tiles = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
  & > div {
    flex: 1;
    display: flex;
    height: 100px;
    flex-direction: column;
    border: 1px solid var(${ThemeColorVariables.border});
    animation: ${flashing} 1s linear infinite alternate;
  }
`;

const Bottom = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  height: 15rem;
  animation: ${flashing} 1s linear infinite alternate;
`;
