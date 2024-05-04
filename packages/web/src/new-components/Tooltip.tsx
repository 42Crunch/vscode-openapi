import * as RadixTooltip from "@radix-ui/react-tooltip";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

export default function Tooltip({
  description,
  children,
}: {
  description: string;
  children: React.ReactNode;
}) {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <TooltipContent>{description}</TooltipContent>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

const TooltipContent = styled(RadixTooltip.Content)`
  color: var(${ThemeColorVariables.notificationsForeground});
  background-color: var(${ThemeColorVariables.notificationsBackground});
  border: 1px solid var(${ThemeColorVariables.notificationsBorder});
  border-radius: 4px;
  padding: 4px 8px;
  margin-right: 16px;
  max-width: 500px;
`;
