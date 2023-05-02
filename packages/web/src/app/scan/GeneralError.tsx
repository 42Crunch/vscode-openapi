import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useAppSelector } from "./store";

export default function Error() {
  const error = useAppSelector((state) => state.scan.error);

  if (!error) {
    return null;
  }

  return (
    <Container>
      <ErrorText>
        <div>{error.message}</div>
        {error.details && <div>{error.details}</div>}
      </ErrorText>
    </Container>
  );
}

const ErrorText = styled.div`
  border: 1px solid var(${ThemeColorVariables.errorBorder});
  color: var(${ThemeColorVariables.errorForeground});
  background-color: var(${ThemeColorVariables.errorBackground});
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  line-break: anywhere;
  > div {
    font-family: monospace;
  }
`;

const Container = styled.div`
  padding: 8px;
`;
