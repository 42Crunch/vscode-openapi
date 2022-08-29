import styled from "styled-components";

import * as Tabs from "@radix-ui/react-tabs";
import Button from "react-bootstrap/Button";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

import { goBack } from "../../store/oasSlice";

import { HttpResponse } from "@xliic/common/http";

import { ThemeColorVariables } from "@xliic/common/theme";
import ResponseStatus from "./ResponseStatus";
import Headers from "./Headers";
import Body from "./Body";
import Tools from "./Tools";

export default function ResponseTabs({ response }: { response: HttpResponse }) {
  const tabs = [
    {
      id: "body",
      title: "Body",
      content: <Body response={response} />,
      enabled: response.body !== "",
    },
    {
      id: "headers",
      title: "Headers",
      content: <Headers headers={response.headers} />,
      enabled: true,
    },
    {
      id: "tools",
      title: "Tools",
      content: <Tools response={response} />,
      enabled: true,
    },
  ];

  const dispatch = useAppDispatch();

  const activeId = tabs.filter((tab) => tab.enabled)?.[0]?.id;

  if (activeId === undefined) {
    return null;
  }

  const [activeTab, setActiveTab] = useState(activeId);

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <TabList>
        {tabs
          .filter((tab) => tab.enabled)
          .map((tab) => (
            <TabButton key={tab.id} value={tab.id}>
              {tab.title}
            </TabButton>
          ))}
        <StyledResponseStatus response={response} />
        <Button variant="primary" className="" onClick={() => dispatch(goBack())}>
          Back
        </Button>
      </TabList>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id}>
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

const StyledResponseStatus = styled(ResponseStatus)`
  flex: 1;
  border-bottom: 1px solid var(${ThemeColorVariables.tabBorder});
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
`;

const TabList = styled(Tabs.List)`
  margin: 0.25rem;
  display: flex;
`;

const TabButton = styled(Tabs.Trigger)`
  border-radius: 0.375rem 0.375rem 0 0;
  border: 1px solid var(${ThemeColorVariables.tabBorder});
  padding: 0.25rem 1rem;
  color: var(${ThemeColorVariables.tabInactiveForeground});
  background-color: var(${ThemeColorVariables.tabInactiveBackground});

  &[data-state="active"] {
    color: var(${ThemeColorVariables.tabActiveForeground});
    background-color: var(${ThemeColorVariables.tabActiveBackground});
    border-bottom: 1px transparent solid;
  }
`;
