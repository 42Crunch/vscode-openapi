import styled from "styled-components";
import * as Tooltip from "@radix-ui/react-tooltip";

import { ThemeColorVariables } from "@xliic/common/theme";
import { TriangleExclamation } from "../../../icons";

export type ListItem = {
  id: string;
  label: string;
};

export default function List({
  items,
  selected,
  setSelected,
  filter,
  errors,
}: {
  items: ListItem[];
  selected: string | undefined;
  setSelected: (selected: string) => void;
  filter?: string;
  errors?: Record<string, string | undefined>;
}) {
  return (
    <Body>
      {items
        .filter(
          (item) => filter === undefined || item.label.toLowerCase().includes(filter.toLowerCase())
        )
        .map((item) => {
          if (item.id === selected) {
            return (
              <SelectedItem key={item.id}>
                <span>{item.label}</span>
                {errors?.[item.id] !== undefined && <ErrorMarker message={errors[item.id]} />}
              </SelectedItem>
            );
          }
          return (
            <Item onClick={() => setSelected(item.id)} key={item.id}>
              <span>{item.label}</span>
              {errors?.[item.id] !== undefined && <ErrorMarker message={errors[item.id]} />}
            </Item>
          );
        })}
    </Body>
  );
}

function ErrorMarker({ message }: { message?: string }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <TooltipIcon>
            <TriangleExclamation />
          </TooltipIcon>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <TooltipContent>{message}</TooltipContent>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

const Body = styled.ul`
  padding: 0;
  margin: 0;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  list-style: none;
  height: 36px;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  cursor: pointer;
  padding: 4px 8px;
  overflow: hidden;
  > span {
    flex: 1;
  }
`;

const SelectedItem = styled(Item)`
  background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
  color: var(${ThemeColorVariables.listActiveSelectionForeground});
  border-radius: 2px;
`;

const TooltipIcon = styled.div`
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
  }
`;

const TooltipContent = styled(Tooltip.Content)`
  color: var(${ThemeColorVariables.notificationsForeground});
  background-color: var(${ThemeColorVariables.notificationsBackground});
  border: 1px solid var(${ThemeColorVariables.notificationsBorder});
  border-radius: 4px;
  padding: 4px 8px;
  margin-right: 16px;
`;
