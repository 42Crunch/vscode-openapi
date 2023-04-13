import { useEffect, useState } from "react";
import styled from "styled-components";
import { useForm, FormProvider } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Config as ConfigData } from "@xliic/common/config";

import List from "../../components/List";
import { MagnifyingGlass } from "../../icons";
import { saveConfig, useFeatureDispatch, useFeatureSelector } from "../../features/config/slice";
import PlatformConnection from "./PlatformConnection";
import Scan from "./Scan";

const platformSettings = [
  { id: "platform-connection", label: "Platform connection" },
  { id: "platform-scan", label: "Scan" },
];

export default function Config() {
  const { data, ready } = useFeatureSelector((state) => state.config);

  if (!ready) {
    return null;
  }

  return <ConfigForm values={wrapFormValues(data)} />;
}

function ConfigForm({ values }: { values: ConfigData }) {
  const dispatch = useFeatureDispatch();

  const [selected, setSelected] = useState("platform-connection");
  const [search, setSearch] = useState("");

  const methods = useForm({
    values,
    mode: "onChange",
  });

  const {
    formState: { isDirty, isValid },
  } = methods;

  function onSubmit(values: ConfigData) {
    dispatch(saveConfig(values));
  }

  useEffect(() => {
    if (isDirty && isValid) {
      methods.handleSubmit(onSubmit)();
    }
  }, [isDirty, isValid]);

  return (
    <Container>
      <FormProvider {...methods}>
        <Sidebar>
          <Search>
            <input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <MagnifyingGlass />
          </Search>
          {/* <Subheader>Try It</Subheader>
          <List selected={selected} setSelected={setSelected} items={s} /> */}
          <Subheader>42Crunch Platform</Subheader>
          <List
            selected={selected}
            setSelected={setSelected}
            items={platformSettings}
            filter={search.trim()}
          />
        </Sidebar>
        <Content>
          {selected === "platform-connection" && <PlatformConnection />}
          {selected === "platform-scan" && <Scan />}
        </Content>
      </FormProvider>
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
  > div {
    margin: 8px 0;
  }
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

export function wrapFormValues(values: ConfigData): ConfigData {
  const mutable = JSON.parse(JSON.stringify(values)) as ConfigData;
  if (mutable.platformApiToken === undefined) {
    mutable.platformApiToken = "";
  }
  return mutable;
}
