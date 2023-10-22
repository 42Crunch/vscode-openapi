import * as Tabs from "@radix-ui/react-tabs";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useEffect, useState } from "react";
import styled from "styled-components";

export function TabContainer({
  tabs,
  activeTab,
  setActiveTab,
  menu,
}: {
  tabs: Tab[];
  activeTab?: string;
  setActiveTab?: (activeTab: string) => void;
  menu?: JSX.Element;
}) {
  if (setActiveTab !== undefined && activeTab !== undefined) {
    return (
      <ControlledTabContainer
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menu={menu}
      />
    );
  }
  return <UncontrolledTabContainer tabs={tabs} menu={menu} />;
}

export function UncontrolledTabContainer({ tabs, menu }: { tabs: Tab[]; menu?: JSX.Element }) {
  const [activeTab, setActiveTab] = useState(tabs.filter((tab) => !tab.disabled)?.[0]?.id);

  useEffect(() => {
    // if tabs has changed, check if the activeTab is still valid and reset if not
    if (tabs.filter((tab) => tab.id === activeTab).length === 0) {
      // make first non-disabled tab an active tab
      setActiveTab(tabs.filter((tab) => !tab.disabled)?.[0]?.id);
    }
  }, [tabs]);

  if (activeTab === undefined) {
    return null;
  }

  return (
    <ControlledTabContainer
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      menu={menu}
    />
  );
}

export function ControlledTabContainer({
  tabs,
  activeTab,
  setActiveTab,
  menu,
}: {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (activeTab: string) => void;
  menu?: JSX.Element;
}) {
  const active = tabs.filter((tab) => !tab.disabled);

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <TabList>
        {active.map((tab) => (
          <TabButton key={tab.id} value={tab.id}>
            {tab.title}
            {renderCounter(tab)}
            {tab.menu && <TabMenu className="menu">{tab.menu}</TabMenu>}
          </TabButton>
        ))}
        {menu && <Menu>{menu}</Menu>}
      </TabList>
      {active.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id}>
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

function renderCounter(tab: Tab) {
  if (!tab.counter) {
    return null;
  }

  return tab.counterKind === "error" ? (
    <ErrorCounter>{tab.counter}</ErrorCounter>
  ) : (
    <Counter>{tab.counter}</Counter>
  );
}

export type Tab = {
  id: string;
  title: string;
  content: JSX.Element;
  menu?: JSX.Element;
  disabled?: boolean;
  counter?: number;
  counterKind?: "normal" | "error";
};

export const TabList = styled(Tabs.List)`
  display: flex;
  border-bottom: 1px solid var(${ThemeColorVariables.tabBorder});
  padding-left: 15px;
`;

export const TabButton = styled(Tabs.Trigger)`
  border: none;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 16px;
  padding-right: 8px;
  color: var(${ThemeColorVariables.tabInactiveForeground});
  background: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;

  &[data-state="active"] {
    color: var(${ThemeColorVariables.tabActiveForeground});
    border-bottom: 3px solid var(${ThemeColorVariables.buttonBackground});
    cursor: inherit;
  }

  &[data-state="active"] > span.menu {
    opacity: 1;
    display
  }
`;

export const RoundTabButton = styled(Tabs.Trigger)`
  border: none;
  border-radius: 8px;
  padding: 0.2rem 1rem;
  margin: 6px 6px;
  color: var(${ThemeColorVariables.tabInactiveForeground});
  background-color: var(${ThemeColorVariables.computedOne});
  //border-bottom: 3px solid transparent;
  cursor: pointer;
  position: relative;

  &[data-state="active"] {
    color: var(${ThemeColorVariables.tabActiveForeground});
    cursor: inherit;
  }

  &[data-state="active"]:before {
    border-bottom: 3px solid var(${ThemeColorVariables.buttonBackground});
    content: "";
    position: absolute;
    bottom: -6px;
    left: 0;
    right: 0;
    height: 3px;
  }
`;

const Counter = styled.span`
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  padding: 2px 4px;
`;

const ErrorCounter = styled.span`
  background-color: var(${ThemeColorVariables.errorBackground});
  color: var(${ThemeColorVariables.errorForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  padding: 2px 4px;
`;

const Menu = styled.div`
  flex: 1;
  display: flex;
  justify-content: end;
`;

const TabMenu = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  cursor: pointer;
  padding-left: 4px;
  > svg {
    width: 14px;
    height: 14px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;
