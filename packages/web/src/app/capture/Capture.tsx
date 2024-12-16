import { useAppDispatch, useAppSelector } from "./store";
import Button from "../../new-components/Button";
import {
  browseFiles,
  downloadResult,
  executionStart,
  executionStatus,
  openLink,
  prepare,
  prepareUploadFile,
} from "./slice";
import { useEffect, useState } from "react";
import ProgressBar from "../config/ProgressBar";
import Input from "../../components/Input";
import Form from "../../new-components/Form";
import { PrepareOptions } from "@xliic/common/capture";
import styled from "styled-components";
import CollapsibleCard, {
  BottomDescription,
  BottomItem,
  TopDescription,
} from "../../components/CollapsibleCard";

function wrapPrepareOptions(env: PrepareOptions) {
  return env;
}

function unwrapPrepareOptions(data: any): PrepareOptions {
  // const env: UnknownEnvironment = {};
  // for (const { key, value, type } of data.env) {
  //   env[key] = convertToType(value, type);
  // }
  return data;
}

export function RootContainer() {
  const dispatch = useAppDispatch();
  const {
    items,
    files,
    quickgenId,
    prepareRespError,
    prepareUploadFileInProgress,
    prepareUploadFileProgress,
    startInProgress,
    startComplete,
    status,
    statusInProgress,
    statusPoolingCounter,
    downloadComplete,
    downloadRespError,
    downloadedFile,
  } = useAppSelector((state) => state.capture);

  const [prepareOptions, setPrepareOptions] = useState<PrepareOptions>({
    basePath: "",
    servers: [],
  });

  useEffect(() => {
    if (quickgenId && !prepareRespError) {
      dispatch(
        prepareUploadFile({
          quickgenId,
          files,
        })
      );
    }
  }, [quickgenId]);

  useEffect(() => {
    if (quickgenId && !prepareUploadFileInProgress && prepareUploadFileProgress === 1) {
      dispatch(
        executionStart({
          quickgenId,
        })
      );
    }
  }, [prepareUploadFileInProgress]);

  useEffect(() => {
    if (quickgenId && startComplete) {
      if (statusPoolingCounter > 0) {
        setTimeout(() => {
          console.info(">>> executionStatus " + statusPoolingCounter + ", status = " + status);
          dispatch(
            executionStatus({
              quickgenId,
            })
          );
        }, 1500);
      } else {
        console.info(">>> executionStatus " + statusPoolingCounter + ", status = " + status);
        dispatch(
          executionStatus({
            quickgenId,
          })
        );
      }
    }
  }, [startComplete, statusPoolingCounter]);

  return (
    <Container>
      <Header>
        <HeaderConter>{items.length} files</HeaderConter>
      </Header>
      {items.map((item, index) => (
        <CollapsibleCard key={`item-${index}`}>
          <TopDescription>{item.progressStatus}</TopDescription>
          <BottomDescription>
            <BottomDescription>
              <BottomItem>
                <div>foo</div>
              </BottomItem>
              <BottomItem>
                <div>bar</div>
              </BottomItem>
            </BottomDescription>
          </BottomDescription>
          <div>
            <div>todo</div>
          </div>
        </CollapsibleCard>
      ))}
      ///////////////////
      {
        <>
          <div>Select HAR/Postman files to convert</div>
          <Button
            disabled={false}
            onClick={(e) => {
              dispatch(browseFiles());
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Browse
          </Button>
        </>
      }
      {files.length > 0 && (
        <>
          <div>Selected files: </div>
          {files.map((file, index) => (
            <div key={index}>{file}</div>
          ))}

          <Form
            wrapFormData={wrapPrepareOptions}
            unwrapFormData={unwrapPrepareOptions}
            data={prepareOptions}
            saveData={(data) => setPrepareOptions(data)}
          >
            <Input label="Base Path" name="basePath" />
          </Form>

          <Button
            disabled={false}
            onClick={(e) => {
              //console.info("prepareOptions=" + prepareOptions);
              dispatch(prepare(prepareOptions));
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Convert
          </Button>
        </>
      )}
      {quickgenId && (
        <>
          <div>Prepare quickgenId = {quickgenId}</div>
        </>
      )}
      {prepareUploadFileInProgress && <ProgressBar progress={prepareUploadFileProgress} />}
      {!prepareUploadFileInProgress && prepareUploadFileProgress === 1 && <div>Upload OK</div>}
      {startInProgress && <div>Starting execution...</div>}
      {startComplete && <div>Started!</div>}
      {statusInProgress && <div>waiting for status</div>}
      {!statusInProgress && status && <div>Status = {status}</div>}
      {quickgenId && status === "finished" && (
        <>
          <div>OpenAPI file is ready: </div>
          <Button
            disabled={false}
            onClick={(e) => {
              dispatch(downloadResult({ quickgenId }));
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Download
          </Button>
        </>
      )}
      {downloadComplete && (
        <div>
          File downloaded{" "}
          <LinkRef
            href="#"
            disabled={false}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dispatch(openLink(downloadedFile || ""));
            }}
          >
            {downloadedFile}
          </LinkRef>
        </div>
      )}
    </Container>
  );
}

const LinkRef = styled.a`
  text-decoration: none;
  ${({ disabled }: { disabled?: boolean }) => disabled && "opacity: 0.4;"}
  ${({ disabled }: { disabled?: boolean }) => disabled && "cursor: default;"}
  ${({ disabled }: { disabled?: boolean }) => disabled && "pointer-events: none;"}
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;

const HeaderConter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;

const HeaderAction = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;
