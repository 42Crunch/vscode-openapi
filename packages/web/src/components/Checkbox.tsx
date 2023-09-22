import styled from "styled-components";
import * as ReactCheckbox from "@radix-ui/react-checkbox";
import { useController } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Check } from "../icons";
import { useId } from "react";

export function Checkbox({ name, label }: { name: string; label: string }) {
  const id = useId();

  const { field } = useController({
    name,
  });

  return (
    <Container>
      <CheckboxRoot
        checked={field.value}
        onCheckedChange={(checked) => field.onChange(checked)}
        id={id}
      >
        <Indicator>
          <Check />
        </Indicator>
      </CheckboxRoot>
      <label htmlFor={id}>{label}</label>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const CheckboxRoot = styled(ReactCheckbox.Root)`
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

const Indicator = styled(ReactCheckbox.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  fill: var(${ThemeColorVariables.checkboxForeground});
`;
