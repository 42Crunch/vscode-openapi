import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";

export function ContextMenu({
  children,
  menu,
}: {
  children: React.ReactNode;
  menu: React.ReactNode;
}) {
  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger asChild className="menu">
        {children}
      </RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <DropdownMenuContent>{menu}</DropdownMenuContent>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
}

const DropdownMenuContent = styled(RadixContextMenu.Content)`
  margin: 4px;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  border: 1px solid var(${ThemeColorVariables.dropdownBorder});
  border-radius: 2px;
  min-width: 220px;
  padding: 5px;
  box-shadow: 0 10px 38px var(${ThemeColorVariables.computedTwo});
`;

export const MenuItem = styled(RadixContextMenu.Item)`
  margin: 2px;
  color: var(${ThemeColorVariables.dropdownForeground});
  display: flex;
  gap: 8px;
  padding: 2px 5px;
  padding-left: 10px;
  border-radius: 2px;
  align-items: center;
  outline: none;
  user-select: none;
  &[data-highlighted] {
    background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
    color: var(${ThemeColorVariables.listActiveSelectionForeground});
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

/*
export const CheckboxMenuItem = styled(DropdownMenu.CheckboxItem)`
  display: flex;
  gap: 8px;
  margin: 2px;
  padding: 2px 5px;
  padding-left: 25px;
  align-items: center;
  outline: none;
  user-select: none;
  border-radius: 2px;
  &[data-highlighted] {
    background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
    color: var(${ThemeColorVariables.listActiveSelectionForeground});
  }
`;

export const MenuSeparator = styled(DropdownMenu.Separator)`
  height: 1px;
  background-color: var(${ThemeColorVariables.border});
  margin: 5px;
`;

export const MenuLabel = styled(DropdownMenu.Label)`
  padding-left: 15px;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.8;
`;

const ItemIndicator = styled(DropdownMenu.ItemIndicator)`
  position: absolute;
  left: 15px;
  width: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

*/
