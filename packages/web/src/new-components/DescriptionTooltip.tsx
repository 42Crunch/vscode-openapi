import * as Tooltip from "@radix-ui/react-tooltip";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { CircleQuestion, CircleExclamation } from "../icons";

export default function DescriptionTooltip({
  icon,
  children,
}: {
  icon?: "question" | "exclamation";
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <TooltipIcon>
            {icon === "exclamation" ? <CircleExclamation /> : <CircleQuestion />}
          </TooltipIcon>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <TooltipContent>{children}</TooltipContent>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

const TooltipIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  & > svg {
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
  box-shadow: 0 10px 38px var(${ThemeColorVariables.computedTwo});
`;
