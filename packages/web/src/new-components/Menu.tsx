import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import { EllipsisVertical } from "../icons";

export function Menu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild className="menu">
        <IconButton>
          <EllipsisVertical />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenuContent side="bottom" align="end">
          {children}
        </DropdownMenuContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const IconButton = styled.span`
  background-color: transparent;
  color: transparent;
  border: none;
  margin: 0;
  padding: 0;
  cursor: pointer;
  &[data-state="open"] {
    opacity: 1 !important;
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const DropdownMenuContent = styled(DropdownMenu.Content)`
  margin: 4px;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  border: 1px solid var(${ThemeColorVariables.dropdownBorder});
  min-width: 100px;
  padding: 4px;
`;

export const MenuItem = styled(DropdownMenu.Item)`
  margin: 2px;
  color: var(${ThemeColorVariables.dropdownForeground});
  display: flex;
  gap: 8px;
  align-items: center;
  &[data-highlighted] {
    background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
    color: var(${ThemeColorVariables.listActiveSelectionForeground});
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;
