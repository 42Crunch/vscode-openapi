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
        Generate OpenAPI files automatically from Postman collections or HAR files, directly in your
        IDE. Saves you time and effort by not having to manually create them.
      </p>

      <p>
        <Bold>Get started now!</Bold>
      </p>

      <p>
        <Bold>Step 1</Bold> - Click on <Bold>"Select Postman/HAR files"</Bold> to upload one or more
        Postman collections and HAR files. Please add an environment variable file to any Postman
        collections uploaded.
      </p>

      <p>
        <Bold>Step 2</Bold> - Click on <Bold>Generate</Bold> to automatically generate your OpenAPI
        file.
      </p>

      <p>
        <Bold>Step 3</Bold> - <Bold>Download</Bold> your new OpenAPI file or <Bold>open</Bold> it
        directly in the IDE for further editing. We recommend your run API Audit to improve the
        quality and security of the file.
      </p>

      <Action
        onClick={(e) => {
          dispatch(selectFiles({ id: undefined }));
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <FileImport />
        Select Postman/HAR files
      </Action>

      <p>
        <Bold>File Upload Limitations</Bold>
      </p>

      <p>
        <ul>
          <li>Max 10 files</li>
          <li>Max size of combined files is 250MB</li>
          <li>Supports Postman collections and HAR files</li>
          <li>Only supports one Postman environment variable file per OpenAPI file</li>
        </ul>
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
  font-size: 16px;
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
