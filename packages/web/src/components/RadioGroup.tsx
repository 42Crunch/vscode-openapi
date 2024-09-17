import styled from "styled-components";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { useController } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Circle } from "../icons";
import { useId } from "react";

export type RadioOption = {
  value: string;
  label: string;
};

export function RadioGroup({ name, options }: { name: string; options: RadioOption[] }) {
  const id = useId();

  const { field } = useController({
    name,
  });

  return (
    <Group value={field.value} onValueChange={(value) => field.onChange(value)}>
      {options.map((option, index) => (
        <Option key={index}>
          <Item value={option.value} id={`${id}-${index}`}>
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

export function RadioGroup2({
  value,
  options,
  onValueChange,
}: {
  value: string;
  options: RadioOption[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Group value={value} onValueChange={onValueChange}>
      {options.map((option, index) => (
        <Option key={index}>
          <Item value={option.value} id={`radio-group-item-${index}`}>
            <Indicator>
              <Circle />
            </Indicator>
          </Item>
          <label htmlFor={`radio-group-label-${index}`}>{option.label}</label>
        </Option>
      ))}
    </Group>
  );
}

const Group = styled(RadixRadioGroup.Root)`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const Option = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Item = styled(RadixRadioGroup.Item)`
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

const Indicator = styled(RadixRadioGroup.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
  > svg {
    fill: var(${ThemeColorVariables.checkboxForeground});
  }
`;
