import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { FileExport, Play } from "../../../icons";

export default function TryIt({
  servers,
  selected,
  onTry,
  onChange,
}: {
  servers: string[];
  selected: string;
  onTry: (server: string) => unknown;
  onChange: (server: string) => void;
}) {
  return (
    <Container>
      <Operation>
        <select
          style={{ width: "100%", textOverflow: "ellipsis" }}
          value={selected}
          onChange={(e) => onChange(e.target.value)}
        >
          {servers.map((server, index) => (
            <option key={`${server}-${index}`} value={server}>{`${server}`}</option>
          ))}
        </select>

        <Action
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onTry(selected);
          }}
        >
          <FileExport />
          Try
        </Action>
      </Operation>
    </Container>
  );
}

const Operation = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  display: flex;
  flex: 1;
  height: 2.1rem;
  padding-left: 4px;
  & > select {
    flex: 1;
    border: none;
    background-color: transparent;
    color: var(${ThemeColorVariables.foreground});
    margin-right: 4px;
  }
  > button {
    width: 80px;
  }
`;

const Container = styled.div`
  padding-bottom: 8px;
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