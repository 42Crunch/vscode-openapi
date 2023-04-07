import styled from "styled-components";
import { useSelect } from "downshift";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleUp, AngleDown } from "../icons";

type Book = {
  author: string;
  title: string;
};

const books: Book[] = [
  { author: "Harper Lee", title: "To Kill a Mockingbird" },
  { author: "Lev Tolstoy", title: "War and Peace" },
  { author: "Fyodor Dostoyevsy", title: "The Idiot" },
  { author: "Oscar Wilde", title: "A Picture of Dorian Gray" },
  { author: "George Orwell", title: "1984" },
  { author: "Jane Austen", title: "Pride and Prejudice" },
  { author: "Marcus Aurelius", title: "Meditations" },
  { author: "Fyodor Dostoevsky", title: "The Brothers Karamazov" },
  { author: "Lev Tolstoy", title: "Anna Karenina" },
  { author: "Fyodor Dostoevsky", title: "Crime and Punishment" },
];

function itemToString(item: Book | null) {
  return item ? item.title : "";
}

export default function Select() {
  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({
    items: books,
    itemToString,
  });

  return (
    <Container>
      <Input {...getToggleButtonProps()}>
        <span>{selectedItem ? selectedItem.title : "Elements"}</span>
        {isOpen ? <AngleUp /> : <AngleDown />}
      </Input>
      <List {...getMenuProps()} isOpen={isOpen}>
        {isOpen &&
          books.map((item, index) => (
            <li key={`${item.title}${index}`} {...getItemProps({ item, index })}>
              <span>{item.title}</span>
              <span className="text-sm text-gray-700">{item.author}</span>
            </li>
          ))}
      </List>
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  z-index: 1;
`;

const Input = styled.div`
  display: flex;
  padding: 4px;
  border-radius: 2px;
  border: 1px solid var(${ThemeColorVariables.dropdownBorder});
  background-color: var(${ThemeColorVariables.dropdownBackground});
  color: var(${ThemeColorVariables.dropdownForeground});
  align-items: center;
  cursor: pointer;
  > span {
    flex: 1;
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const List = styled.ul`
  ${({ isOpen }: { isOpen: boolean }) =>
    isOpen && `border: 1px solid var(${ThemeColorVariables.dropdownBorder});`}
  background-color: var(${ThemeColorVariables.dropdownBackground});
  color: var(${ThemeColorVariables.dropdownForeground});
  position: absolute;
  list-style: none;
  padding: 0;
  margin: 4px 0 0 0;
  width: 100%;
  & > li {
    padding: 4px;
    cursor: pointer;
  }
  & > li:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }
`;
