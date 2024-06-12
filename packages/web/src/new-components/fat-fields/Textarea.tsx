import styled from "styled-components";
import { useController } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";

import DescriptionTooltip from "../DescriptionTooltip";

export default function Textarea({
  label,
  name,
  disabled,
  description,
}: {
  label: string;
  name: string;
  disabled?: boolean;
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
      <Container invalid={invalid}>
        <Title>
          <div>
            <span>{label}</span> {disabled && <span>(read only)</span>}
          </div>
          {description && <DescriptionTooltip>{description}</DescriptionTooltip>}
        </Title>
        <textarea {...field} disabled={disabled} />
      </Container>
      {error && <Error>{error?.message}</Error>}
    </>
  );
}

const Container = styled.div`
  height: 240px;
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
  > textarea {
    flex: 1;
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

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: var(${ThemeColorVariables.inputPlaceholderForeground});
`;

const Error = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
`;
