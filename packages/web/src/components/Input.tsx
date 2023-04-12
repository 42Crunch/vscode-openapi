import styled from "styled-components";
import { useFormContext } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";

export default function Input({
  label,
  name,
  disabled,
  password,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  password?: boolean;
}) {
  const { register } = useFormContext();

  return (
    <Container>
      <div>{label}</div>
      <input {...register(name)} disabled={disabled} type={password ? "password" : "text"} />
    </Container>
  );
}

const Container = styled.div`
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 2px;
  border: 1px solid var(${ThemeColorVariables.border});
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 4px;
  &:focus-within {
    border: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  > div {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
  > input {
    background: transparent;
    line-height: 20px;
    border: none;
    padding: 0;
    color: var(${ThemeColorVariables.foreground});
    &::placeholder {
      color: var(${ThemeColorVariables.inputPlaceholderForeground});
    }
    &:focus {
      outline: none;
      //   outline: 1px solid var(${ThemeColorVariables.focusBorder});
    }
  }
`;
