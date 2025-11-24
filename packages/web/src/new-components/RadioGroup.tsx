import styled from "styled-components";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Circle } from "../icons";
import { useId } from "react";

export type RadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export default function RadioGroup({
  value,
  options,
  onValueChange,
}: {
  value: string;
  options: RadioOption[];
  onValueChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <Group value={value} onValueChange={onValueChange}>
      {options.map((option, index) => (
        <Option key={index} $disabled={option.disabled}>
          <Item value={option.value} disabled={!!option.disabled} id={`${id}-${index}`}>
            <Indicator>
              <Circle />
            </Indicator>
          </Item>
          <label htmlFor={`${id}-${index}`}>{option.label}</label>
        </Option>
      ))}
    </Group>
  );
}

export const Group = styled(RadixRadioGroup.Root)`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

export const Option = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  > label {
    color: ${({ $disabled }) =>
      $disabled ? `var(${ThemeColorVariables.disabledForeground})` : "inherit"};
  }
`;

export const Item = styled(RadixRadioGroup.Item)`
  width: 20px;
  height: 20px;
  border-radius: 100%;
  background-color: var(${ThemeColorVariables.checkboxBackground});
  border-color: var(${ThemeColorVariables.checkboxBorder});
  border-width: 2px;
  border-style: solid;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Indicator = styled(RadixRadioGroup.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
  > svg {
    fill: var(${ThemeColorVariables.checkboxForeground});
  }
`;
