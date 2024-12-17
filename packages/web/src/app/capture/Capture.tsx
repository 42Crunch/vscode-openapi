import { useAppDispatch, useAppSelector } from "./store";
import Button from "../../new-components/Button";
import { browseFiles, downloadResult, openLink, setPrepareOptions2, prepare } from "./slice";
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
import { ThemeColorVariables } from "@xliic/common/theme";

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
  const { items } = useAppSelector((state) => state.capture);

  return (
    <Container>
      <Header>
        <HeaderConter>{items.length} files</HeaderConter>
        <HeaderAction>
          <Button
            disabled={false}
            onClick={(e) => {
              dispatch(browseFiles());
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Upload
          </Button>
        </HeaderAction>
      </Header>
      {items.map((item, index) => (
        <CollapsibleCard key={`item-${item.id}`} defaultCollapsed={item.progressStatus !== "New"}>
          {item.quickgenId && (
            <TopDescription>
              <TopDescriptionId>{item.quickgenId}</TopDescriptionId>
              <TopDescriptionProgressStatus failed={item.progressStatus === "Failed"}>
                {item.progressStatus}
              </TopDescriptionProgressStatus>
            </TopDescription>
          )}
          <TableDescription>
            <Grid>
              <TableHeader>
                <div>Selected Files</div>
                <div>Prepare Options</div>
                <div>Log</div>
              </TableHeader>
              <Fields>
                <Row>
                  <CellContainer>
                    {item.files && (
                      <FilesCell>
                        {item.files.map((file, index) => (
                          <span key={`file-${index}`}>{file}</span>
                        ))}
                      </FilesCell>
                    )}
                  </CellContainer>
                  <CellContainer>
                    {item.progressStatus !== "New" && item.prepareOptions.basePath && (
                      <PrepareOptionsCell>
                        basePath = {item.prepareOptions?.basePath}
                      </PrepareOptionsCell>
                    )}
                    {item.progressStatus === "New" && (
                      <PrepareOptionsCell>
                        <Form
                          wrapFormData={wrapPrepareOptions}
                          unwrapFormData={unwrapPrepareOptions}
                          data={item.prepareOptions}
                          saveData={(data) => {
                            dispatch(setPrepareOptions2(data));
                          }}
                        >
                          <Input label="Base Path" name="basePath" />
                        </Form>
                      </PrepareOptionsCell>
                    )}
                  </CellContainer>
                  <CellContainer>
                    {item.log.length > 0 && (
                      <LogsCell>
                        {item.log.map((msg, index) => (
                          <span key={`log-msg-${index}`}>{msg}</span>
                        ))}
                      </LogsCell>
                    )}
                  </CellContainer>
                </Row>
              </Fields>
            </Grid>
            {item.progressStatus === "New" && (
              <ConvertButton
                disabled={false}
                onClick={(e) => {
                  dispatch(prepare({ files: item.files, options: item.prepareOptions }));
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Convert
              </ConvertButton>
            )}
            {item.progressStatus === "Finished" && (
              <FileReadyContainer>
                <ConvertButton
                  disabled={false}
                  onClick={(e) => {
                    dispatch(downloadResult({ quickgenId: item.quickgenId as string }));
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  Download
                </ConvertButton>
                {item.downloadedFile && (
                  <div>
                    File downloaded{" "}
                    <LinkRef
                      href="#"
                      disabled={false}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dispatch(openLink(item.downloadedFile || ""));
                      }}
                    >
                      {item.downloadedFile}
                    </LinkRef>
                  </div>
                )}
              </FileReadyContainer>
            )}
          </TableDescription>
        </CollapsibleCard>
      ))}
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
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: var(${ThemeColorVariables.computedOne});
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
`;

const HeaderConter = styled.div`
  display: flex;
  flex-direction: column;
  padding: 7px;
  padding-left: 16px;
  font-weight: bold;
`;

const HeaderAction = styled.div`
  display: flex;
  flex-direction: column;
  padding: 7px;
  padding-right: 16px;
  width: 120px;
`;

const TopDescriptionId = styled.div`
  width: 200px;
`;

const TopDescriptionProgressStatus = styled.div<{ failed: boolean }>`
  display: flex;
  width: 80px;
  padding: 3px;
  flex-direction: row;
  justify-content: center;
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
  ${({ failed }) =>
    failed
      ? `background-color: var(${ThemeColorVariables.errorBackground});`
      : `background-color: var(${ThemeColorVariables.computedOne});`}
  ${({ failed }) =>
    failed
      ? `border-color: var(${ThemeColorVariables.errorBorder});`
      : `border-color: var(${ThemeColorVariables.border});`}
`;

const TableDescription = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;

const Grid = styled.div`
  display: grid;
  row-gap: 4px;
  grid-template-columns: 1fr 1fr 1fr;
`;

const TableHeader = styled.div`
  display: contents;
  & > div {
    padding: 4px 8px;
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;

const Fields = styled.div`
  display: contents;
  & > div > div {
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
`;

const Row = styled.div`
  display: contents;
`;

const CellContainer = styled.div`
  padding: 4px 8px;
`;

const FilesCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const PrepareOptionsCell = styled.div`
  display: flex;
  flex-direction: column;
`;

const LogsCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const ConvertButton = styled(Button)`
  width: 120px;
`;

const FileReadyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;
