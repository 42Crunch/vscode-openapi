import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { CloudArrowDown, FileCode, FileExport, FileImport, TrashCan } from "../../icons";

import Button from "../../new-components/Button";
import { useAppDispatch, useAppSelector } from "./store";
import { selectFiles } from "./slice";

export default function Start() {
  const dispatch = useAppDispatch();

  return (
    <div>
      <h1>Welcome to the Capture App</h1>
      <p>This is the starting point for capturing API requests.</p>

      <Action
        onClick={(e) => {
          dispatch(selectFiles({ id: undefined }));
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <FileImport />
        Add files
      </Action>
    </div>
  );
}

const Action = styled.div<{ $disabled?: boolean }>`
  display: flex;
  padding: 0 8px;
  gap: 4px;
  align-items: center;
  cursor: pointer;
  color: var(
    ${({ $disabled }) =>
      $disabled ? ThemeColorVariables.disabledForeground : ThemeColorVariables.linkForeground}
  );
  > svg {
    fill: var(
      ${({ $disabled }) =>
        $disabled ? ThemeColorVariables.disabledForeground : ThemeColorVariables.linkForeground}
    );
  }
`;
