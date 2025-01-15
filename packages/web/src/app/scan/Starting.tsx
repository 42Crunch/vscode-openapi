import styled, { keyframes } from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { TriangleExclamation } from "../../icons";
import { useAppSelector } from "./store";

export default function Starting() {
  const { error } = useAppSelector((state) => state.scan);

  return (
    <Container>
      {error && (
        <ErrorMessage>
          <TriangleExclamation />
          <div>{error.message}</div>
        </ErrorMessage>
      )}
      {!error && (
        <>
          <Top />
          <Bottom />
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
  display: flex;
  flex-flow: column;
  gap: 8px;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  padding: 0 20px;
  border: 1px solid var(${ThemeColorVariables.border});
  height: 58px;
  color: var(${ThemeColorVariables.errorForeground});
  background-color: var(${ThemeColorVariables.errorBackground});
  font-size: 14px;
  gap: 8px;
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
    width: 20px;
    height: 20px;
  }
  > div {
    flex: 1;
  }
`;

const Button = styled.button`
  cursor: pointer;
  background-color: var(${ThemeColorVariables.buttonBackground});
  color: var(${ThemeColorVariables.buttonForeground});
  border: none;
  padding: 6px 16px;
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
