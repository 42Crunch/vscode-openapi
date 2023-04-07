import styled from "styled-components";
import * as ReactCheckbox from "@radix-ui/react-checkbox";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Check } from "../icons";

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <Root
      checked={checked}
      onCheckedChange={(checked) => {
        /*
        if (checked) {
          dispatch(saveConfig({ type: "configSslIgnoreAdd", hostname }));
        } else {
          dispatch(saveConfig({ type: "configSslIgnoreRemove", hostname }));
        }
		*/
      }}
    >
      <Indicator>
        <Check />
      </Indicator>
    </Root>
  );
}

const Root = styled(ReactCheckbox.Root)`
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
  fill: var(${ThemeColorVariables.checkboxForeground});
`;
