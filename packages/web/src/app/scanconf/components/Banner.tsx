import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { CircleInfo, TriangleExclamation } from "../../../icons";
import { HTMLAttributes, ReactNode } from "react";

export function Banner({
  message,
  children,
  ...attrs
}: { message: string; children?: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <Container {...attrs}>
      <div>
        <div>
          <CircleInfo />
        </div>
        <span>{message}</span>
      </div>
      {children && <div>{children}</div>}
    </Container>
  );
}

export function ErrorBanner({
  message,
  children,
  ...attrs
}: { message: string; children?: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <ErrorContainer {...attrs}>
      <div>
        <div>
          <TriangleExclamation />
        </div>
        <span>{message}</span>
      </div>
      {children && <div>{children}</div>}
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
    > div {
      display: flex;
      align-items: center;
    }
    > div > svg {
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
    > div {
      display: flex;
      align-items: center;
    }
    > div > svg {
      fill: var(${ThemeColorVariables.errorForeground});
    }
  }
`;
