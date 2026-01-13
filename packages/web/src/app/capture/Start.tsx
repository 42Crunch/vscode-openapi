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
        Generate OpenAPI files automatically from Postman collections and HAR files, directly in
        your IDE. This saves you time and avoids extra manual effort.
      </p>

      <Action
        onClick={(e) => {
          dispatch(selectFiles({ id: undefined }));
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <FileImport />
        Select Postman or HAR files
      </Action>

      <p>
        <Bold>Get started now!</Bold>
      </p>

      <p>
        <Bold>Step 1</Bold> - Click <Bold>Select Postman or HAR files</Bold> to upload one or more
        Postman collections and HAR files. If you use environment variables in your Postman
        collections, also include an environment variable file.
        <ul>
          <li>Max 10 files</li>
          <li>Max size of combined files is 250MB</li>
          <li>Supports multiple Postman collections and HAR files</li>
          <li>Supports one environment variable file per OpenAPI file</li>
        </ul>
      </p>

      <p>
        <Bold>Step 2</Bold> - Click <Bold>Generate</Bold> to automatically generate your OpenAPI
        file.
      </p>

      <p>
        <Bold>Step 3</Bold> - <Bold>Download</Bold> your new OpenAPI file or <Bold>edit</Bold> it it
        directly in the IDE. We recommend your run audit on your API contract to improve its quality
        and security.
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
  font-size: 15px;
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
