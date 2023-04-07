import { useState } from "react";
import styled from "styled-components";
import { useForm, FormProvider } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";
import List from "../../components/List";
import { Input } from "../../components/Input";
import { Checkbox } from "../../components/Checkbox";
import { MagnifyingGlass } from "../../icons";

export function Test() {
  const s = [{ id: "foo", label: "Insecure SSL hosts" }];

  const ss = [
    { id: "foo1", label: "Platform connection" },
    { id: "bar1", label: "Data Dictionary" },
    { id: "baz1", label: "Scan" },
  ];

  const [selected, setSelected] = useState(s[0]?.id);

  const methods = useForm({
    defaultValues: { platformUrl: "https://platform.42crunch.com", token: "foo" },
    mode: "onChange",
  });

  return (
    <Container>
      <FormProvider {...methods}>
        <Sidebar>
          <Search>
            <input placeholder="Search" />
            <MagnifyingGlass />
          </Search>
          <Subheader>Try It</Subheader>
          <List selected={selected} setSelected={setSelected} items={s} />
          <Subheader>42Crunch Platform</Subheader>
          <List selected={selected} setSelected={setSelected} items={ss} />
        </Sidebar>
        <Content>
          <h4 style={{ marginTop: 0 }}>Connection parameters</h4>
          <Input label="Platform URL" name="platformUrl" />
          <Input label="IDE token" name="token" />
          <Button>Test connection</Button>
          <div>foo</div>
          <Checkbox checked />
        </Content>
      </FormProvider>
    </Container>
  );
}

// const Container = styled.div`
//   margin: 4px;
// `;

const Container = styled.div`
  display: flex;
  background-color: var(${ThemeColorVariables.background});
  height: 100vh;
  overflow: hidden;
  > :first-child {
    width: 280px;
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
  > div {
    margin: 8px 0;
  }
`;

const Sidebar = styled.div`
  padding: 16px;
  border-right: 1px solid var(${ThemeColorVariables.border});
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

const Button = styled.button`
  cursor: pointer;
  background-color: var(${ThemeColorVariables.buttonBackground});
  color: var(${ThemeColorVariables.buttonForeground});
  border: none;
  padding: 6px 16px;
  border-radius: 2px;
  &:focus {
    outline: none;
  }
`;
