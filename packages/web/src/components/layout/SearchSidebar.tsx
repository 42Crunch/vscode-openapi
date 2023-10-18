import { ReactNode, useState } from "react";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { MagnifyingGlass } from "../../icons";
import List, { ListItem } from "../List";
import React from "react";

export type Section = {
  id: string;
  title: string;
  items: ListItem[];
  menu?: React.ReactNode;
  itemMenu?: React.ReactNode;
};

export type ItemId = {
  sectionId: string;
  itemId: string;
};

export default function SearchSidebar(props: {
  sections: Section[];
  noSectionTitles?: boolean;
  errors?: Record<string, string | undefined>;
  defaultSelection?: ItemId;
  render: (selection: ItemId | undefined) => ReactNode;
  onSelected?: (selected: ItemId) => void;
}) {
  const [selected, setSelected] = useState(
    props.defaultSelection || {
      sectionId: props.sections?.[0]?.id,
      itemId: props.sections?.[0]?.items?.[0]?.id,
    }
  );
  return <SearchSidebarControlled {...props} selected={selected} onSelected={setSelected} />;
}

export function SearchSidebarControlled({
  render,
  renderButtons,
  sections,
  errors,
  defaultSelection,
  noSectionTitles,
  selected,
  onSelected,
}: {
  sections: Section[];
  noSectionTitles?: boolean;
  errors?: Record<string, string | undefined>;
  defaultSelection?: ItemId;
  render: (selection: ItemId | undefined) => ReactNode;
  renderButtons?: () => ReactNode;
  selected?: ItemId;
  onSelected?: (selected: ItemId) => void;
}) {
  const [search, setSearch] = useState("");

  return (
    <Container>
      <Sidebar>
        <Search>
          <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <MagnifyingGlass />
        </Search>
        <Sections>
          {sections.map((section: Section) => (
            <React.Fragment key={section.title}>
              {!noSectionTitles && (
                <Subheader>
                  <span>{section.title}</span>
                  {section.menu && <Menu>{section.menu}</Menu>}
                </Subheader>
              )}
              <List
                selected={selected?.sectionId == section.id ? selected.itemId : undefined}
                setSelected={(selected) =>
                  onSelected && onSelected({ sectionId: section.id, itemId: selected })
                }
                items={section.items}
                errors={errors}
                filter={search.trim()}
              />
            </React.Fragment>
          ))}
        </Sections>
        {renderButtons && <Buttons>{renderButtons()}</Buttons>}
      </Sidebar>
      <Content>{render(selected)}</Content>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  background-color: var(${ThemeColorVariables.background});
  > :first-child {
    width: 240px;
    overflow-y: auto;
  }
  > :last-child {
    flex: 1;
    overflow-y: auto;
  }
`;

const Content = styled.div`
  background-color: var(${ThemeColorVariables.computedOne});
  padding: 16px;
`;

const Sections = styled.div`
  flex: 1;
  > ul {
    > li {
      > .menu {
        opacity: 0;
      }
    }
    > li:hover {
      > .menu {
        opacity: 1;
      }
    }
  }
`;

const Buttons = styled.div``;

const Sidebar = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Subheader = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(${ThemeColorVariables.disabledForeground});
`;

const Menu = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const Search = styled.div`
  display: flex;
  height: 40px;
  align-items: center;
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 2px;
  border: 1px solid var(${ThemeColorVariables.border});

  > input {
    flex: 1;
    margin-left: 8px;
    background-color: transparent;
    border: none;
    color: var(${ThemeColorVariables.foreground});
    padding: 4px;

    &::placeholder {
      color: var(${ThemeColorVariables.inputPlaceholderForeground});
      font-size: 14px;
    }

    &:focus {
      outline: none;
      // outline: 1px solid var(${ThemeColorVariables.focusBorder});
    }
  }

  > svg {
    width: 16px;
    height: 16px;
    fill: var(${ThemeColorVariables.foreground});
    margin: 8px;
  }

  &:focus-within {
    border: 1px solid var(${ThemeColorVariables.focusBorder});
  }
`;
