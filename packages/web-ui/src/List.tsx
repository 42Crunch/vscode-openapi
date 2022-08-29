import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function List({
  items,
  selected,
  setSelected,
}: {
  items: any[];
  selected: string;
  setSelected: (selected: string) => void;
}) {
  return (
    <Body>
      {items.map((item) => {
        if (item.id === selected) {
          return <SelectedItem key={item.id}>{item.name}</SelectedItem>;
        }
        return (
          <Item onClick={() => setSelected(item.id)} key={item.id}>
            {item.name}
          </Item>
        );
      })}
    </Body>
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
  height: 41px;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  cursor: pointer;
  padding-left: 0.25rem;
  overflow: hidden;
`;

const SelectedItem = styled(Item)`
  background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
  color: var(${ThemeColorVariables.listActiveSelectionForeground});
`;
