import styled from "styled-components";
import * as ReactCheckbox from "@radix-ui/react-checkbox";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Check } from "../icons";
import { useId } from "react";
import DescriptionTooltip from "./DescriptionTooltip";

export function Checkbox({
  label,
  value,
  description,
  onChange,
  size,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string | React.ReactNode;
  size: "medium" | "small";
  description?: string;
}) {
  const id = useId();

  const CheckboxRoot = size === "medium" ? MediumCheckboxRoot : SmallCheckboxRoot;

  return (
    <Container>
      <CheckboxRoot
        checked={value}
        onCheckedChange={(checked) => {
          if (typeof checked === "boolean") {
            onChange(checked);
          }
        }}
        id={id}
      >
        <Indicator>
          <Check />
        </Indicator>
      </CheckboxRoot>
      <label htmlFor={id}>{label}</label>
      {description !== undefined && <DescriptionTooltip>{description}</DescriptionTooltip>}
    </Container>
  );
}

export const Container = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const MediumCheckboxRoot = styled(ReactCheckbox.Root)`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(${ThemeColorVariables.checkboxBackground});
  border-radius: 4px;
  border-color: var(${ThemeColorVariables.checkboxBorder});
  border-width: 1px;
  border-style: solid;
`;

const SmallCheckboxRoot = styled(ReactCheckbox.Root)`
  width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(${ThemeColorVariables.checkboxBackground});
  border-radius: 3px;
  border-color: var(${ThemeColorVariables.checkboxBorder});
  border-width: 1px;
  border-style: solid;
`;

export const Indicator = styled(ReactCheckbox.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  fill: var(${ThemeColorVariables.checkboxForeground});
  width: 10px;
  height: 10px;
`;
