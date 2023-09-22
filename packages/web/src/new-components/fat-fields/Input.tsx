import styled from "styled-components";
import { useController } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";
import DescriptionTooltip from "../DescriptionTooltip";

export default function Input({
  label,
  name,
  disabled,
  password,
  description,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  password?: boolean;
  description?: string;
}) {
  const {
    field,
    fieldState: { error, invalid },
  } = useController({
    name,
  });

  return (
    <>
      <Container>
        <Inner invalid={invalid}>
          <div>
            <span>{label}</span> {disabled && <span>(read only)</span>}
          </div>
          <input {...field} disabled={disabled} type={password ? "password" : "text"} />
        </Inner>
        <div className="description">
          {description && <DescriptionTooltip description={description} />}
        </div>
      </Container>
      {error && <Error>{error?.message}</Error>}
    </>
  );
}

const Container = styled.div`
  display: flex;
  flow-direction: column;
  > div:first-child {
    flex: 1;
  }
  > div.description {
    width: 0em;
    display: flex;
    align-items: center;
    justify-content: center;
    > svg {
      fill: var(${ThemeColorVariables.foreground});
    }
  }
`;

const Inner = styled.div`
  height: 40px;
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 4px;

  ${({ invalid }: { invalid?: boolean }) =>
    invalid
      ? `border: 1px solid var(${ThemeColorVariables.errorBorder});`
      : `border: 1px solid var(${ThemeColorVariables.border});
         &:focus-within {
           border: 1px solid var(${ThemeColorVariables.focusBorder});
         }
      `}

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
    }
  }
`;

const Error = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
`;
