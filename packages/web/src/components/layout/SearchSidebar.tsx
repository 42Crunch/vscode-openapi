import { ReactNode, useState } from "react";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { ArrowLeftToLine, ArrowRightToLine, MagnifyingGlass } from "../../icons";
import List, { ListItem } from "../List";
import React from "react";

export type Section = {
  id: string;
  title: string;
  items: ListItem[];
  menu?: React.ReactNode;
};

export type ItemId = {
  sectionId: string;
  itemId: string;
};

export default function SearchSidebar(props: {
  title?: string;
  sections: Section[];
  noSectionTitles?: boolean;
  errors?: Record<string, string | undefined>;
  defaultSelection?: ItemId;
  render: (selection: ItemId) => ReactNode;
  renderEmpty?: () => ReactNode;
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
  renderEmpty,
  sections,
  errors,
  defaultSelection,
  noSectionTitles,
  selected,
  onSelected,
  title,
  hideEmptySections,
}: {
  title?: string;
  sections: Section[];
  noSectionTitles?: boolean;
  errors?: Record<string, string | undefined>;
  defaultSelection?: ItemId;
  render: (selection: ItemId) => ReactNode;
  renderButtons?: () => ReactNode;
  renderEmpty?: () => ReactNode;
  selected?: ItemId;
  onSelected?: (selected: ItemId) => void;
  hideEmptySections?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(true);

  const count = sections.map((section) => section.items).flat().length;

  return (
    <>
      {!expanded && (
        <SidebarCollapsed>
          <ToggleButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <ArrowRightToLine />
          </ToggleButton>
        </SidebarCollapsed>
      )}
      {expanded && (
        <Sidebar>
          <Title>
            <span>
              {count} {title || "items"}
            </span>
            <ToggleButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              <ArrowLeftToLine />
            </ToggleButton>
          </Title>
          <Search>
            <input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <MagnifyingGlass />
          </Search>
          <Sections>
            {sections.map((section: Section) => {
              if (section.items.length === 0 && hideEmptySections && section.menu === undefined) {
                return null;
              }
              return (
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
              );
            })}
          </Sections>
          {renderButtons && <Buttons>{renderButtons()}</Buttons>}
        </Sidebar>
      )}
      <Content expanded={expanded}>
        {selected !== undefined ? render(selected) : renderEmpty?.()}
      </Content>
    </>
  );
}

const Sidebar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 288px;
  overflow-y: scroll;
  bottom: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: var(${ThemeColorVariables.background});
`;

const SidebarCollapsed = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  overflow-y: scroll;
  bottom: 0;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background-color: var(${ThemeColorVariables.background});
`;

const Content = styled.div<{ expanded: boolean }>`
  position: absolute;
  ${({ expanded }) => (expanded ? `left: 320px;` : `left: 40px;`)}
  top: 0;
  right: 0;
  bottom: 0;
  background-color: var(${ThemeColorVariables.computedOne});
  padding: 16px;
  overflow-y: auto;
`;

const Sections = styled.div`
  flex: 1;
  overflow-y: auto;
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
  opacity: 0.4;
`;

const Menu = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const Title = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  > span:first-child {
    flex: 1;
    font-weight: 600;
  }
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: transparent;
  border: none;
  padding: 0;
  > svg {
    height: 16px;
    width: 16px;
    fill: var(${ThemeColorVariables.foreground});
  }
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
