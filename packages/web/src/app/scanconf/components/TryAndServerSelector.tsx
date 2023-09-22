import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { FileExport, Play } from "../../../icons";
import DownshiftCombo from "../../../new-components/DownshiftCombo";
import { setScanServer } from "../../../features/prefs/slice";
import { useFeatureDispatch, useFeatureSelector } from "../../../features/prefs/slice";
import { useState } from "react";

export default function TryAndServerSelector({
  onTry,
  onScan,
  servers,
}: {
  onTry: (server: string) => unknown;
  onScan?: (server: string) => unknown;
  servers: string[];
}) {
  const dispatch = useFeatureDispatch();
  const setServer = (server: string) => dispatch(setScanServer(server));
  const scanServer = useFeatureSelector((state) => state.prefs.scanServer);
  const [selectedServer, setSelectedServer] = useState(scanServer !== "" ? scanServer : servers[0]);

  const allServers =
    servers.includes(scanServer) || scanServer === "" ? servers : [...servers, scanServer];

  return (
    <Container>
      <Operation>
        <DownshiftCombo
          options={allServers}
          selected={selectedServer}
          onSelectedItemChange={(item) => item && setSelectedServer(item)}
        />
        <Action
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!servers.includes(selectedServer)) {
              setServer(selectedServer);
            }
            onTry(selectedServer);
          }}
        >
          <FileExport />
          Try
        </Action>
        {onScan && (
          <Action
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!servers.includes(selectedServer)) {
                setServer(selectedServer);
              }
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
  cusror: pointer;
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
