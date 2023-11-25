import styled from "styled-components";
import { useSelect } from "downshift";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleDown } from "../icons";

export type SelectOption<T> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export default function DownshiftSelect<T>({
  options,
  placeholder,
  selected,
  onSelectedItemChange,
  bottomMenu,
}: {
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  selected?: SelectOption<T>["value"];
  onSelectedItemChange: (item: SelectOption<T> | null | undefined) => void;
  bottomMenu?: JSX.Element;
}) {
  const selectedItem = options.filter((item) => item.value === selected)?.[0];

  function itemToString(item: SelectOption<T> | null) {
    return item ? item.label : "";
  }

  function isItemDisabled(item: SelectOption<T>): boolean {
    return item?.disabled === true;
  }

  const { isOpen, getToggleButtonProps, getMenuProps, getItemProps } = useSelect({
    items: options,
    isItemDisabled,
    itemToString,
    selectedItem: selectedItem || null,
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      onSelectedItemChange(newSelectedItem);
    },
  });

  return (
    <Container onClick={(e) => e.stopPropagation()}>
      <SelectContainer>
        <Input {...getToggleButtonProps()}>
          {selectedItem === undefined && placeholder !== undefined && (
            <Placeholder>{placeholder}</Placeholder>
          )}
          {selectedItem !== undefined && <SelectedItem>{selectedItem.label}</SelectedItem>}
          <AngleDown />
        </Input>
      </SelectContainer>
      <Dropdown {...getMenuProps()} isOpen={isOpen}>
        {isOpen &&
          options.map((item, index) => (
            <li key={`${item.value}${index}`} {...getItemProps({ item, index })}>
              <span>{item.label}</span>
            </li>
          ))}
        {isOpen && bottomMenu}
      </Dropdown>
    </Container>
  );
}

const Container = styled.div`
  position: relative;
`;

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  &:focus-within {
    border: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  border: 1px solid transparent;
`;

const Input = styled.div`
  display: flex;
  color: var(${ThemeColorVariables.foreground});
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  > span {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  > svg {
    margin-left: 3px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Placeholder = styled.span`
  color: var(${ThemeColorVariables.inputPlaceholderForeground});
`;

const SelectedItem = styled.span``;

const Dropdown = styled.ul`
  max-height: 250px;
  overflow-y: auto;
  z-index: 1;
  position: absolute;
  left: 0;
  right: 0;
  margin: 0;
  list-style: none;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  color: var(${ThemeColorVariables.dropdownForeground});
  ${({ isOpen }: { isOpen: boolean }) =>
    isOpen &&
    `
    border: 1px solid var(${ThemeColorVariables.dropdownBorder});
    padding: 4px;
  `}

  & > li {
    padding: 4px;
    cursor: pointer;
  }

  & > li:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }

  & > li[aria-disabled="true"] {
    color: var(${ThemeColorVariables.disabledForeground});
  }

  & > li[aria-disabled="true"]:hover {
    background-color: transparent;
  }
`;
