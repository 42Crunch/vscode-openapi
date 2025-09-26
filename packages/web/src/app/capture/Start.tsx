import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { FileImport } from "../../icons";

import { useAppDispatch } from "./store";
import { openLink, selectFiles } from "./slice";

export default function Start() {
  const dispatch = useAppDispatch();

  return (
    <Contents>
      <h1>Welcome to API Contract Generator</h1>

      <p>
        Save time by reducing the manual creation of OpenAPI files; generate OpenAPI files
        automatically from Postman collections or HAR files, directly in your IDE. Saving you time
        and effort of manually creating OpenAPI files.
      </p>

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

      <p>
        <Bold>Get started now!</Bold>
      </p>

      <p>
        <Bold>Step 1</Bold> - Click on <Bold>Add files</Bold> to upload the Postman collection for
        your API and / or HAR files recording traffic to it
      </p>

      <p>
        <Bold>Step 2</Bold> - Click on <Bold>Generate</Bold> to automatically generate your OpenAPI
        file.
      </p>

      <p>
        <Bold>Step 3</Bold> - <Bold>Download</Bold> your new OpenAPI file, or <Bold>open</Bold> it
        in the IDE for further editing.
      </p>
    </Contents>
  );
}

const Contents = styled.div`
  max-width: 600px;
`;

const Bold = styled.span`
  font-weight: 600;
`;

const Action = styled.div<{ $disabled?: boolean }>`
  display: flex;
  padding: 0;
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
