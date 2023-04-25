import styled from "styled-components";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Config } from "@xliic/common/config";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Check } from "../../icons";
import { useFormContext, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";

import { addInsecureSslHostname, removeInsecureSslHostname } from "../../features/config/slice";

import { parseHttpsHostname } from "../../util";

export default function Settings({ config }: { config: Config }) {
  const dispatch = useDispatch();

  const { control } = useFormContext();

  const server = useWatch({
    control,
    name: "server",
  }) as string;

  const [https, hostname] = parseHttpsHostname(server);
  const ignore = config.insecureSslHostnames.includes(hostname);

  return (
    <Container>
      <h4>SSL Settings</h4>
      {https && (
        <Item>
          <StyledCheckbox
            checked={ignore}
            onCheckedChange={(checked) => {
              if (checked) {
                dispatch(addInsecureSslHostname(hostname));
              } else {
                dispatch(removeInsecureSslHostname(hostname));
              }
            }}
          >
            <StyledIndicator>
              <Check />
            </StyledIndicator>
          </StyledCheckbox>
          Ignore SSL errors for "{hostname}"
        </Item>
      )}

      {!https && <Item>SSL Settings are not available</Item>}
    </Container>
  );
}

const StyledCheckbox = styled(Checkbox.Root)`
  margin-right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(${ThemeColorVariables.checkboxBackground});
  border-radius: 4px;
  border-color: var(${ThemeColorVariables.checkboxBorder});
  border-width: 1px;
  border-style: solid;
`;

const StyledIndicator = styled(Checkbox.Indicator)`
  fill: var(${ThemeColorVariables.checkboxForeground});
`;

const Container = styled.div`
  margin-left: 0.25rem;
  margin-right: 0.25rem;
`;

const Item = styled.div`
  display: flex;
`;
