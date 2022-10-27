import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useAppSelector } from "./store";

export default function Error() {
  const error = useAppSelector((state) => state.scan.error!);

  return (
    <Container>
      <Header>
        <Message>
          <Title>Failed to send request</Title>
        </Message>
      </Header>
      <ErrorText>{error.message}</ErrorText>
    </Container>
  );
}

const Message = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  border-radius: 0.375rem;
  margin-right: 0.25rem;
  display: flex;
  overflow: hidden;
  flex: 1;
  align-items: center;
`;

const Title = styled.div`
  flex: 1;
  padding-left: 0.5rem;
`;

const Header = styled.div`
  display: flex;
`;

const ErrorText = styled.div`
  border: 1px solid var(${ThemeColorVariables.errorBorder});
  color: var(${ThemeColorVariables.errorForeground});
  background-color: var(${ThemeColorVariables.errorBackground});
  border-radius: 0.375rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
`;

const Container = styled.div`
  margin-top: 0.25rem;
  margin-left: 0.25rem;
  margin-right: 0.25rem;
`;
