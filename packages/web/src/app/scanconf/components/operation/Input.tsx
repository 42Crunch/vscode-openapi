import styled from "styled-components";
import { useController } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";

export default function Input({
  label,
  name,
  disabled,
  password,
  style,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  password?: boolean;
  style?: React.CSSProperties;
}) {
  const {
    field,
    fieldState: { error, invalid },
  } = useController({
    name,
  });

  return (
    <>
      <Container style={style}>
        <input
          {...field}
          disabled={disabled}
          type={password ? "password" : "text"}
          style={{ width: "100%" }}
        />
      </Container>
      {error && <Error>{error?.message}</Error>}
    </>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 4px;

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
    }
  }
`;

const Error = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
`;
