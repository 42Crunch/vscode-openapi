import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import { Check, EllipsisVertical, Sliders } from "../icons";

export function Menu({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: "ellipsis" | "sliders";
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild className="menu">
        <IconButton>{icon === "sliders" ? <Sliders /> : <EllipsisVertical />}</IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenuContent side="bottom" align="end">
          {children}
        </DropdownMenuContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function CheckboxMenuItemIndicator() {
  return (
    <ItemIndicator>
      <Check />
    </ItemIndicator>
  );
}

const IconButton = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  border-radius: 2px;
  min-width: 220px;
  padding: 5px;
  box-shadow: 0 10px 38px var(${ThemeColorVariables.computedTwo});
`;

export const MenuItem = styled(DropdownMenu.Item)`
  margin: 2px;
  color: var(${ThemeColorVariables.dropdownForeground});
  display: flex;
  gap: 8px;
  padding: 2px 5px;
  padding-left: 25px;
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
