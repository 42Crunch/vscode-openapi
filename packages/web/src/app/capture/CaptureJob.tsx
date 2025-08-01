import * as z from "zod";
import styled from "styled-components";

import { PrepareOptions } from "@xliic/common/capture";
import { ProgressButton } from "../../new-components/ProgressButton";
import { ThemeColorVariables } from "@xliic/common/theme";

import Input from "../../components/Input";
import Form from "../../new-components/Form";
import { CloudArrowDown, FileCode, Link, TrashCan } from "../../icons";

import {
  setPrepareOptions,
  convert,
  deleteJob,
  downloadFile,
  openLink,
  selectFiles,
} from "./slice";
import { useAppDispatch, useAppSelector } from "./store";
import Button from "../../new-components/Button";
import { Menu, MenuItem } from "../../new-components/Menu";

export default function CaptureJob() {
  const dispatch = useAppDispatch();

  const { selectedItem: item } = useAppSelector((state) => state.capture);

  if (!item) {
    return <div>No job selected</div>;
  }

  return (
    <div>
      {/* <ProgressButton
        label="Convert"
        waiting={item.status === "running"}
        onClick={(e) => {
          //if (isValid) {
          dispatch(convert({ id: item.id, files: item.files, options: item.prepareOptions }));
          //} else {
          //  trigger();
          //}
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      <Button
        onClick={(e) => {
          dispatch(downloadFile({ id: item.id }));
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        Download
      </Button>

      <Button
        onClick={(e) => {
          dispatch(deleteJob({ id: item.id }));
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        Delete
      </Button> */}

      <Title>Selected files</Title>
      <FilesList>
        {item.files && (
          <div>
            {item.files.map((url, index) => (
              <File key={`item-${item.id}-file-${index}`}>
                <FileCode /> {getFilename(url)}
                <Menu>
                  <MenuItem onSelect={() => null}>
                    <TrashCan />
                    Delete
                  </MenuItem>
                </Menu>
              </File>
            ))}
          </div>
        )}

        <Action
          onClick={(e) => {
            dispatch(selectFiles({ id: item.id }));
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Link />
          Upload
        </Action>

        <Action
          onClick={(e) => {
            dispatch(downloadFile({ id: item.id }));
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <CloudArrowDown />
          Download
        </Action>
      </FilesList>

      <Separator />
      <Title>Options</Title>
      <Form
        wrapFormData={wrapPrepareOptions}
        unwrapFormData={unwrapPrepareOptions}
        useFormMode={"onChange"}
        data={item.prepareOptions}
        schema={schema}
        saveData={(data) => {
          dispatch(setPrepareOptions({ id: item.id, ...data }));
        }}
      >
        <Options>
          <Input label="Base Path" name="basePath" />
          <Input label="Servers" name="servers" />
        </Options>
      </Form>

      <Separator />
      <Title>Logs</Title>

      <Logs>
        {item.log.map((log, index) => (
          <div key={index}>{log}</div>
        ))}

        {item.downloadedFile && (
          <div key={`item-${item.id}-log-${item.log.length}`}>
            Saved to{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(openLink(item.downloadedFile || ""));
              }}
            >
              {item.downloadedFile}
            </a>
          </div>
        )}
      </Logs>
    </div>
  );
}

function wrapPrepareOptions(env: PrepareOptions) {
  return { basePath: env.basePath, servers: env.servers.join(",") };
}

function unwrapPrepareOptions(data: any): PrepareOptions {
  return { basePath: data.basePath, servers: data.servers.split(",") };
}

const Action = styled.div`
  display: flex;
  padding: 0 8px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
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
`;

const Logs = styled.div`
  font-family: monospace;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Separator = styled.hr`
  border: none;
  border-top: 1px solid var(${ThemeColorVariables.border});
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
  return url.substring(url.lastIndexOf("/") + 1);
}
