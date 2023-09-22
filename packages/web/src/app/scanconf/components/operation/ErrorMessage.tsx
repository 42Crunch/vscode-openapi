import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function ErrorMessage({ message }: { message: string }) {
  return <ErrorText>{message}</ErrorText>;
}

const ErrorText = styled.div`
  border: 1px solid var(${ThemeColorVariables.errorBorder});
  color: var(${ThemeColorVariables.errorForeground});
  background-color: var(${ThemeColorVariables.errorBackground});
  border-radius: 0.375rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
`;
