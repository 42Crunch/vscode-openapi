import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { FileImport } from "../../icons";

import { useAppDispatch, useAppSelector } from "./store";
import { selectFiles } from "./slice";
import Subscription from "./Subscription";
import GeneralError from "../../features/general-error/GeneralError";

export default function Start() {
  const dispatch = useAppDispatch();

  const useDevEndpoints = useAppSelector((state) => state.config.data.internalUseDevEndpoints);
  const token = useAppSelector((state) => state.capture.token);

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

      {token !== undefined && (
        <SubscriptionDetails>
          <Subscription token={token} useDevEndpoints={useDevEndpoints} />
        </SubscriptionDetails>
      )}
      <GeneralError />
    </Contents>
  );
}

const Contents = styled.div`
  max-width: 600px;
`;

const SubscriptionDetails = styled.div`
  margin-top: 2em;
  margin-bottom: 2em;
`;

const Bold = styled.span`
  font-weight: 600;
`;

const Action = styled.div<{ $disabled?: boolean }>`
  margin-top: 2em;
  margin-bottom: 2em;
  display: flex;
  padding: 0;
  gap: 4px;
  align-items: center;
  font-weight: 600;
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
