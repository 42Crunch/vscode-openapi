import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useAppSelector } from "./store";

export default function Error() {
  const error = useAppSelector((state) => state.tryit.error);

  if (!error) {
    return null;
  }

  return (
    <Container>
      <ErrorText>{error.message}</ErrorText>
      {error.sslError && (
        <div>Failed to establish secure connection. Try disabling SSL validation in Settings</div>
      )}
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
`;

const Container = styled.div`
  padding: 8px;
`;
