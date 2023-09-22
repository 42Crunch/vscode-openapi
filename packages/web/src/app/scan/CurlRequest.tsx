import * as Tooltip from "@radix-ui/react-tooltip";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { Clone } from "../../icons";
import { useAppDispatch } from "./store";

import { sendCurlRequest } from "./slice";

export default function CurlRequest({
  curl,
  id,
  waiting,
}: {
  curl: string;
  id: string;
  waiting: boolean;
}) {
  const dispatch = useAppDispatch();

  return (
    <Request>
      <Code style={{ lineBreak: "anywhere", whiteSpace: "pre-line" }}>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span>
                <Clone
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(sendCurlRequest(curl));
                  }}
                />
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <TooltipContent sideOffset={5}>
                Copy cURL command to the clipboard
                <TooltipArrow />
              </TooltipContent>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        {curl}
      </Code>
    </Request>
  );
}

const Request = styled.div``;

const Code = styled.div`
  & > span {
    cursor: pointer;
    position: absolute;
    top: 6px;
    right: 6px;
    & > svg {
      fill: var(${ThemeColorVariables.foreground});
    }
  }
  padding: 4px;
  padding-right: 24px;
  position: relative;
  font-family: monospace;
  background-color: var(${ThemeColorVariables.computedOne});
`;

const TooltipContent = styled(Tooltip.Content)`
  color: var(${ThemeColorVariables.notificationsForeground});
  background-color: var(${ThemeColorVariables.notificationsBackground});
  border: 1px solid var(${ThemeColorVariables.notificationsBorder});
  border-radius: 4px;
  padding: 4px 8px;
  margin-right: 16px;
`;

const TooltipArrow = styled(Tooltip.Arrow)`
  fill: var(${ThemeColorVariables.notificationsForeground});
`;
