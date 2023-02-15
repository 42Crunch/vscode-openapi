import styled from "styled-components";

import { HttpRequest } from "@xliic/common/http";
import { useAppDispatch, useAppSelector } from "./store";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Clone } from "../../icons";
import * as Tooltip from "@radix-ui/react-tooltip";

import { sendHttpRequest, sendCurlRequest } from "./slice";
import { ProgressButton } from "../../components/ProgressButton";

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
  const env = useAppSelector((state) => state.env.data);
  const defaultValues = useAppSelector((state) => state.scan.defaultValues);
  const security = defaultValues?.security[defaultValues.securityIndex];

  const secretCurl = curl.replace(/{{([\w-]+)\/([\w-]+)}}/gm, (match, p1, p2): string => {
    if (security !== undefined && typeof security[p1] === "string") {
      return security[p1] as string;
    }
    return match;
  });

  const request = extract(secretCurl, id);

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
                    dispatch(sendCurlRequest(secretCurl));
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
      <Buttons>
        <ProgressButton
          label={"Resend"}
          waiting={waiting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(sendHttpRequest(request));
          }}
        />
      </Buttons>
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

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  > button {
    width: 80px;
    height: 22px;
  }
`;

type ParsedValue = {
  type: "plain" | "single" | "double";
  value: string;
};

function extract(curl: string, id: string): HttpRequest {
  const parts = split(curl).slice(1);
  const result: HttpRequest = {
    id,
    url: parts.pop()!,
    headers: {},
    method: "get",
    config: {
      https: {
        rejectUnauthorized: false,
      },
    },
  };

  for (let i = 0; i < parts.length; i++) {
    const flag = parts[i];
    const value = parts[i + 1];
    if (flag === "-d") {
      result.body = value;
    } else if (flag == "-X") {
      result.method = value.toLowerCase() as HttpRequest["method"];
    } else if (flag === "-H") {
      const [headerName, headerValue] = value.split(": ", 2);
      result.headers[headerName] = headerValue;
    }
  }

  return result;
}

function split(string: string): string[] {
  return splitDetailed(string).map((details) => details.value);
}

function splitDetailed(string: string): ParsedValue[] {
  const groupsRegex = /[^\s"']+|(?:"|'){2,}|"(?!")([^"]*)"|'(?!')([^']*)'|"|'/g;

  const matches: ParsedValue[] = [];

  let match;

  while ((match = groupsRegex.exec(string))) {
    if (match[2]) {
      // Single quoted group
      matches.push({ type: "single", value: match[2] });
    } else if (match[1]) {
      // Double quoted group
      matches.push({ type: "double", value: match[1] });
    } else {
      // No quote group present
      matches.push({ type: "plain", value: match[0]! });
    }
  }

  return matches;
}
