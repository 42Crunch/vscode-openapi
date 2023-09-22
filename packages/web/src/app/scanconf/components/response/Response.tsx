import { useState } from "react";
import styled from "styled-components";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ThemeColorVariables } from "@xliic/common/theme";
import { HttpResponse } from "@xliic/common/http";
import { AngleDown } from "../../../../icons";
import Headers from "./Headers";
import Body from "./Body";

export default function Response({
  response,
  accented,
  title,
  tools,
}: {
  response: HttpResponse;
  accented?: boolean;
  title?: string;
  tools?: JSX.Element;
}) {
  const tabs = [
    {
      id: "body",
      title: "Body",
      content: <Body response={response} />,
      enabled: response.body !== undefined && response.body !== "",
    },
    {
      id: "headers",
      title: "Headers",
      content: <Headers headers={response.headers} />,
      enabled: true,
    },
  ];

  if (tools) {
    tabs.push({
      id: "tools",
      title: "Tools",
      content: tools,
      enabled: true,
    });
  }

  const [activeId, setActiveId] = useState(tabs.filter((tab) => tab.enabled)?.[0]?.id);

  if (activeId === undefined) {
    return null;
  }

  const active = tabs.filter((tab) => tab.id === activeId)[0];

  return (
    <Container accented={accented}>
      <Header>
        {title && <div style={{ flex: 1 }}>{title}</div>}
        <div>Status: {response.statusCode}</div>
        <div>Size: {response.body ? response.body.length : "0"} bytes</div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <IconButton>
              <span>{active.title}</span>
              <AngleDown
                style={{
                  width: 12,
                  height: 12,
                  fill: `var(${ThemeColorVariables.foreground})`,
                }}
              />
            </IconButton>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenuContent>
              {tabs
                .filter((tab) => tab.enabled)
                .map((tab) => (
                  <DropdownMenuItem
                    key={tab.id}
                    onSelect={() => {
                      setActiveId(tab.id);
                    }}
                  >
                    {tab.title}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Header>
      <Content>{active.content}</Content>
    </Container>
  );
}

const Container = styled.div`
  ${({ accented }: { accented: boolean | undefined }) =>
    accented && `background-color: var(${ThemeColorVariables.computedOne}); padding: 4px;`}
`;

const Content = styled.div``;

const Header = styled.div`
  display: flex;
  gap: 2em;
  flow-direction: row;
  margin-bottom: 8px;
  justify-content: space-between;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  padding-bottom: 4px;
`;

const IconButton = styled.button`
  background-color: transparent;
  color: var(${ThemeColorVariables.foreground});
  border: none;
  padding: 0;
  > svg {
    margin-left: 4px;
  }
`;

const DropdownMenuContent = styled(DropdownMenu.Content)`
  margin: 4px;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  border: 1px solid var(${ThemeColorVariables.dropdownBorder});
  min-width: 160px;
  padding: 4px;
`;

const DropdownMenuItem = styled(DropdownMenu.Item)`
  position: relative;
  margin: 2px;
  color: var(${ThemeColorVariables.dropdownForeground});
  &[data-highlighted] {
    background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
    color: var(${ThemeColorVariables.listActiveSelectionForeground});
  }
`;
