import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { GeneralError } from "@xliic/common/error";

export default function Error({ error }: { error: GeneralError }) {
  return (
    <Container>
      <ErrorText>{error.message}</ErrorText>
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
