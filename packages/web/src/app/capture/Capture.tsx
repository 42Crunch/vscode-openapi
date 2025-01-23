import { PrepareOptions } from "@xliic/common/capture";
import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import * as z from "zod";
import CollapsibleCard, { TopDescription } from "../../components/CollapsibleCard";
import Input from "../../components/Input";
import { TrashCan } from "../../icons";
import Button from "../../new-components/Button";
import Form from "../../new-components/Form";
import { ProgressButton } from "../../new-components/ProgressButton";
import {
  browseFiles,
  convert,
  deleteJob,
  downloadFile,
  openLink,
  setPrepareOptions,
  setPrepareOptionsNotValid,
} from "./slice";
import { useAppDispatch, useAppSelector } from "./store";

function wrapPrepareOptions(env: PrepareOptions) {
  return { basePath: env.basePath, servers: env.servers.join(",") };
}

function unwrapPrepareOptions(data: any): PrepareOptions {
  return { basePath: data.basePath, servers: data.servers.split(",") };
}

export function RootContainer() {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.capture);
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
  return (
    <Container>
      <Header>
        <HeaderConter>{items.length} files</HeaderConter>
        <HeaderAction>
          <Button
            disabled={false}
            onClick={(e) => {
              const newIds = items.filter((item) => item.progressStatus === "New");
              const id = newIds.length === 1 ? newIds[0].id : "";
              const options = newIds.length === 1 ? newIds[0].prepareOptions : undefined;
              dispatch(browseFiles({ id, options }));
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
          <TopDescriptionMain>
            <TopDescriptionLeft>
              <TopDescriptionId>{item.quickgenId}</TopDescriptionId>
              <TopDescriptionProgressStatus failed={item.progressStatus === "Failed"}>
                {item.progressStatus}
              </TopDescriptionProgressStatus>
            </TopDescriptionLeft>
            <TopDescriptionRight>
              {item.progressStatus !== "In progress" && (
                <TopDescriptionAction>
                  <TopDescriptionRemoverSpan
                    onClick={(e) => {
                      dispatch(deleteJob({ id: item.id, quickgenId: item.quickgenId as string }));
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <TrashCan />
                  </TopDescriptionRemoverSpan>
                </TopDescriptionAction>
              )}
            </TopDescriptionRight>
          </TopDescriptionMain>
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
                          <span key={`item-${item.id}-file-${index}`}>{file}</span>
                        ))}
                      </FilesCell>
                    )}
                  </CellContainer>
                  <CellContainer>
                    {item.progressStatus !== "New" && item.prepareOptions.basePath && (
                      <PrepareOptionsCell>
                        <div>Base Path = {item.prepareOptions?.basePath}</div>
                        <div>Servers = {item.prepareOptions.servers.join(", ")}</div>
                      </PrepareOptionsCell>
                    )}
                    {item.progressStatus === "New" && (
                      <PrepareOptionsCell>
                        <Form
                          wrapFormData={wrapPrepareOptions}
                          unwrapFormData={unwrapPrepareOptions}
                          data={item.prepareOptions}
                          schema={schema}
                          saveData={(data) => {
                            dispatch(setPrepareOptions({ id: item.id, ...data }));
                          }}
                          onInvalidData={() => {
                            dispatch(setPrepareOptionsNotValid({ id: item.id }));
                          }}
                        >
                          <Input label="Base Path" name="basePath" />
                          <Input label="Servers" name="servers" />
                        </Form>
                      </PrepareOptionsCell>
                    )}
                  </CellContainer>
                  <CellContainer>
                    {item.log.length > 0 && (
                      <LogsCell>
                        {item.log.map((msg, index) => (
                          <div key={`item-${item.id}-log-${index}`}>
                            <span>{msg}</span>
                          </div>
                        ))}
                        {item.downloadedFile && (
                          <div key={`item-${item.id}-log-${item.log.length}`}>
                            Saved to{" "}
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
                      </LogsCell>
                    )}
                  </CellContainer>
                </Row>
              </Fields>
            </Grid>
            {item.progressStatus !== "Finished" && (
              <ConvertButton
                label="Convert"
                disabled={!item.isPrepareOptionsValid}
                waiting={item.progressStatus === "In progress"}
                onClick={(e) => {
                  dispatch(
                    convert({ id: item.id, files: item.files, options: item.prepareOptions })
                  );
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            )}
            {item.progressStatus === "Finished" && (
              <FileReadyContainer>
                <ConvertButton
                  label="Download"
                  waiting={false}
                  onClick={(e) => {
                    dispatch(downloadFile({ id: item.id, quickgenId: item.quickgenId as string }));
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
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

export const TopDescriptionMain = styled(TopDescription)`
  justify-content: space-between;
`;

export const TopDescriptionLeft = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const TopDescriptionRight = styled.div`
  padding-right: 3px;
`;

const TopDescriptionId = styled.div`
  width: 300px;
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

export const TopDescriptionAction = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const TopDescriptionRemoverSpan = styled.span`
  font-weight: bold;
  cursor: pointer;
  // padding: 16px;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
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
  gap: 5px;
`;

const LogsCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
  max-height: 200px;
`;

const ConvertButton = styled(ProgressButton)`
  height: 30px;
  width: 120px;
`;

const FileReadyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;
