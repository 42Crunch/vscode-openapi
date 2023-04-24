import { ReactNode, useState } from "react";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { MagnifyingGlass } from "../../icons";
import List, { ListItem } from "../List";
import React from "react";

export type Section = {
  title: string;
  items: ListItem[];
};

export default function SearchSidebar({
  render,
  sections,
  defaultSelection,
}: {
  sections: Section[];
  defaultSelection?: string;
  render: (selection: string) => ReactNode;
}) {
  const [selected, setSelected] = useState(defaultSelection || sections?.[0]?.items?.[0].id || "");
  const [search, setSearch] = useState("");
  return (
    <Container>
      <Sidebar>
        <Search>
          <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <MagnifyingGlass />
        </Search>
        {sections.map((section: Section) => (
          <React.Fragment key={section.title}>
            <Subheader>{section.title}</Subheader>
            <List
              selected={selected}
              setSelected={setSelected}
              items={section.items}
              filter={search.trim()}
            />
          </React.Fragment>
        ))}
      </Sidebar>
      <Content>{render(selected)}</Content>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  background-color: var(${ThemeColorVariables.background});
  height: 100vh;
  overflow: hidden;
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

const Sidebar = styled.div`
  padding: 16px;
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
