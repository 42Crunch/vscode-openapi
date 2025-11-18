import * as z from "zod";
import styled, { keyframes } from "styled-components";
import { useFormContext } from "react-hook-form";

import { CaptureItem, PrepareOptions } from "@xliic/common/capture";
import { ThemeColorVariables } from "@xliic/common/theme";

import Input from "../../new-components/fat-fields/Input";
import Form from "../../new-components/Form";
import {
  CircleNotchLight,
  CloudArrowDown,
  FileCode,
  FileExport,
  FileImport,
  TrashCan,
} from "../../icons";
import {
  saveCaptureSettings,
  convert,
  downloadFile,
  openLink,
  selectFiles,
  deleteFile,
} from "./slice";
import { useAppDispatch, useAppSelector } from "./store";
import { Menu, MenuItem } from "../../new-components/Menu";
import ProgressBar from "./ProgressBar";

export default function CaptureJob() {
  const dispatch = useAppDispatch();
  const { selectedId, items } = useAppSelector((state) => state.capture);

  const item = items.find((item) => item.id === selectedId);

  if (!item) {
    return <div>No job selected</div>;
  }

  return (
    <Form
      wrapFormData={wrapPrepareOptions}
      unwrapFormData={unwrapPrepareOptions}
      useFormMode={"onChange"}
      data={item.prepareOptions}
      schema={schema}
      saveData={(data) => {
        dispatch(
          saveCaptureSettings({
            id: item.id,
            settings: { files: item.files, prepareOptions: data },
          })
        );
      }}
    >
      <CaptureJobForm item={item} />
    </Form>
  );
}

function CaptureJobForm({ item }: { item: CaptureItem }) {
  const dispatch = useAppDispatch();
  const {
    formState: { isValid },
  } = useFormContext();

  return (
    <div>
      <Title>API Contract Generator</Title>
      <ul>
        <li>Add up to 10 files</li>
        <li>Max size of combined files is 250MB</li>
        <li>Supports Postman collections and HAR files</li>
      </ul>
      <Separator />

      <Title>Selected files</Title>
      <FilesList>
        {item.files && (
          <div>
            {item.files.map((url, index) => (
              <File key={`item-${item.id}-file-${index}`}>
                <FileCode /> {getFilename(url)}
                <Menu>
                  <MenuItem onSelect={() => dispatch(deleteFile({ id: item.id, file: url }))}>
                    <TrashCan />
                    Delete
                  </MenuItem>
                </Menu>
              </File>
            ))}
          </div>
        )}

        {(item.status === "pending" || item.status === "failed") && (
          <Action
            onClick={(e) => {
              dispatch(selectFiles({ id: item.id }));
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <FileImport />
            Add more files
          </Action>
        )}

        {(item.status === "pending" || item.status === "failed") && item.files.length > 0 && (
          <Action
            $disabled={!isValid}
            $primary
            onClick={(e) => {
              if (isValid) {
                dispatch(convert({ id: item.id }));
              }
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <FileExport />
            Generate
          </Action>
        )}

        {item.status === "finished" && (
          <Action
            $primary
            onClick={(e) => {
              dispatch(downloadFile({ id: item.id }));
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <CloudArrowDown />
            Save OpenAPI file
          </Action>
        )}

        {item.status === "running" && (
          <Spinner>
            <CircleNotchLight />
          </Spinner>
        )}
      </FilesList>

      <Separator />
      <Title>Options</Title>

      <Options>
        <Input
          label="Base Path"
          name="basePath"
          description="The URL prefix for all API paths, relative to the host root"
        />
        <Input label="Servers" name="servers" description="A list of servers to use for the API" />
      </Options>

      <Separator />
      <Title>Logs</Title>

      <Logs>
        {item.log.map((log, index) => (
          <div key={index}>{log}</div>
        ))}

        {item.downloadedFile && (
          <div key={`item-${item.id}-log-${item.log.length}`}>
            OpenAPI file saved to{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(openLink(item.downloadedFile || ""));
              }}
            >
              {getFilename(item.downloadedFile)}
            </a>
          </div>
        )}
      </Logs>

      {Object.keys(item.uploadStatus).length > 0 && (
        <>
          <Separator />
          <Title>Upload progress</Title>
          <UploadProgress>
            {Object.entries(item.uploadStatus || {}).map(([url, status]) => (
              <ProgressBar key={url} label={getFilename(url)} progress={status.percent} />
            ))}
          </UploadProgress>
        </>
      )}
    </div>
  );
}

function wrapPrepareOptions(env: PrepareOptions) {
  return { basePath: env.basePath, servers: env.servers.join(",") };
}

function unwrapPrepareOptions(data: any): PrepareOptions {
  return { basePath: data.basePath, servers: data.servers.split(",") };
}

const Action = styled.div<{ $disabled?: boolean; $primary?: boolean }>`
  display: flex;
  padding: 0 8px;
  gap: 4px;
  align-items: center;
  cursor: pointer;
  font-weight: ${({ $primary }) => ($primary ? "600" : "400")};
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

const File = styled.div`
  display: flex;
  padding: 0 8px;
  gap: 4px;
  align-items: center;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
  > span:last-child {
    visibility: hidden;
  }
  &:hover > span:last-child {
    visibility: visible;
  }
`;

const Title = styled.div`
  margin-top: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(${ThemeColorVariables.foreground});
`;

const Options = styled.div`
  margin-top: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  max-width: 600px;
  gap: 16px;
`;

const FilesList = styled.div`
  display: flex;
  flex-direction: row;
  padding-bottom: 8px;
  align-items: start;
`;

const Logs = styled.div`
  font-family: monospace;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const UploadProgress = styled.div`
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Separator = styled.hr`
  border: none;
  border-top: 1px solid var(${ThemeColorVariables.border});
`;

const rotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;

const Spinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  > svg {
    animation: ${rotation} 2s infinite linear;
    transition: width 0.2s linear;
  }
`;

const schema = z.object({
  basePath: z.string().min(1).trim(),
  servers: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
          .every((e) => e.startsWith("http://") || e.startsWith("https://")),
      {
        message: "Invalid format. Examples: 'https://foo.com, http://bar.org'",
      }
    ),
});

function getFilename(url: string): string {
  return decodeURIComponent(url.substring(url.lastIndexOf("/") + 1));
}
