import * as Tooltip from "@radix-ui/react-tooltip";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { CircleQuestion } from "../icons";

export default function DescriptionTooltip({ description }: { description: string }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <TooltipIcon>
            <CircleQuestion />
          </TooltipIcon>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

const TooltipIcon = styled.div`
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const TooltipContent = styled(Tooltip.Content)`
  color: var(${ThemeColorVariables.notificationsForeground});
  background-color: var(${ThemeColorVariables.notificationsBackground});
  border: 1px solid var(${ThemeColorVariables.notificationsBorder});
  border-radius: 4px;
  padding: 4px 8px;
  margin-right: 16px;
  max-width: 500px;
`;
