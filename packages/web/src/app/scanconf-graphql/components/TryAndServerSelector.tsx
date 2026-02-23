import { useState } from "react";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import * as actions from "../../../features/prefs/slice";
import { useFeatureDispatch, useFeatureSelector } from "../../../features/prefs/slice";
import { Play } from "../../../icons";
import DownshiftCombo from "../../../new-components/DownshiftCombo";

export default function TryAndServerSelector({
  onTry,
  onScan,
  servers,
  host,
  menu,
}: {
  onTry: (server: string) => unknown;
  onScan?: (server: string) => unknown;
  servers: string[];
  host?: string;
  menu?: boolean;
}) {
  const { scanServer, useGlobalBlocks, rejectUnauthorized } = useFeatureSelector(
    (state) => state.prefs
  );

  const dispatch = useFeatureDispatch();
  const setServer = (server: string) => dispatch(actions.setScanServer(server));
  const allServers = [...servers];

  if (host && !allServers.includes(host)) {
    allServers.unshift(host);
  }

  const [selectedServer, setSelectedServer] = useState(
    scanServer !== "" ? scanServer : allServers[0]
  );

  if (!allServers.includes(scanServer) && scanServer !== "") {
    allServers.push(scanServer);
  }

  return (
    <Container>
      <Operation>
        <DownshiftCombo
          options={allServers}
          selected={selectedServer}
          onSelectedItemChange={(item) => {
            if (item) {
              setSelectedServer(item);
              setServer(item);
            }
          }}
        />

        {onScan && (
          <Action
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onScan(selectedServer);
            }}
          >
            <Play />
            Scan
          </Action>
        )}
      </Operation>
    </Container>
  );
}

const Operation = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  display: flex;
  align-items: center;
  flex: 1;
  height: 2.1rem;
  padding-left: 4px;
  & > div:first-child {
    flex: 1;
  }
`;

const Container = styled.div`
  background-color: var(${ThemeColorVariables.background});
  color: var(${ThemeColorVariables.foreground});
`;

const Action = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
