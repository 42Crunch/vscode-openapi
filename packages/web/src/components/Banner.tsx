import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { CircleInfo, TriangleExclamation } from "../icons";
import { ReactNode } from "react";

export function Banner({ message }: { message: string }) {
  return (
    <Container>
      <div>
        <CircleInfo />
        {message}
      </div>
    </Container>
  );
}

export function ErrorBanner({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <ErrorContainer>
      <div>
        <TriangleExclamation />
        {message}
      </div>
      <div>{children}</div>
    </ErrorContainer>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  > div:first-child {
    display: flex;
    align-items: center;
    gap: 8px;
    > svg {
      fill: var(${ThemeColorVariables.foreground});
    }
  }
  border: 1px solid var(${ThemeColorVariables.border});
  border-radius: 2px;
  color: var(${ThemeColorVariables.foreground});
  padding: 8px;
  gap: 8px;
`;

const ErrorContainer = styled(Container)`
  border: 1px solid var(${ThemeColorVariables.errorBorder});
  background-color: var(${ThemeColorVariables.errorBackground});
  color: var(${ThemeColorVariables.errorForeground});
  > div:first-child {
    > svg {
      fill: var(${ThemeColorVariables.errorForeground});
    }
  }
`;
