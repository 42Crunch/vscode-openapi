import React from "react";
import styled from "styled-components";

import { ApiEntry, TagData } from "@xliic/common/tags";
import { ThemeColorVariables } from "@xliic/common/theme";

import { ErrorBanner } from "../../components/Banner";
import {
  ApiResponseEntry,
  refreshOptions,
  ResponseEntry,
  TagResponseEntry,
  useGetApisFromCollectionQuery,
  useGetCollectionsQuery,
} from "../../features/http-client/platform-api";
import { Tags, TrashCan } from "../../icons";
import { CollectionOrApiSearchSelector } from "./CollectionOrApiSearchSelector";
import { SelectOption } from "./SearchSelector";
import { saveTags, saveTagsInStateOnly } from "./slice";
import { useAppDispatch } from "./store";

type SelectOptionState = SelectOption<ResponseEntry> | undefined;

export function ApiPanel({
  targetFileName,
  tagData,
}: {
  targetFileName: string;
  tagData: TagData;
}) {
  const dispatch = useAppDispatch();
  const targetData = tagData[targetFileName];
  // Previously selected data from IDE
  const apiEntry: ApiEntry | undefined =
    targetData === null || Array.isArray(targetData) ? undefined : targetData;
  // Current manually selected options
  const [colOption, setColOption] = React.useState<SelectOptionState>(undefined);
  const [apiOption, setApiOption] = React.useState<SelectOptionState>(undefined);
  const showApiSelector = colOption || apiEntry?.collectionId;
  return (
    <HeaderContainer>
      <SelectPanel
        type="collection"
        apiEntry={apiEntry}
        selectedOptionId={colOption ? colOption.id : apiEntry?.collectionId}
        getQueryParameter={() => ""}
        onOptionRemoved={(): void => {
          setApiOption(undefined);
          setColOption(undefined);
          dispatch(saveTags({ [targetFileName]: null }));
        }}
        onOptionSelected={(option: SelectOption<ResponseEntry>): void => {
          setApiOption(undefined);
          setColOption(option);
          dispatch(saveTags({ [targetFileName]: null }));
        }}
      ></SelectPanel>

      {showApiSelector && (
        <SelectPanel
          type="api"
          apiEntry={apiEntry}
          selectedOptionId={apiOption ? apiOption.id : apiEntry?.apiId}
          getQueryParameter={() =>
            (colOption ? colOption.value.desc.id : apiEntry?.collectionId) as string
          }
          onOptionRemoved={(): void => {
            setApiOption(undefined);
            const tagData: TagData = {};
            tagData[targetFileName] = {
              apiId: "",
              apiName: "",
              collectionId: colOption?.value.desc.id || apiEntry?.collectionId,
              collectionName: colOption?.value.desc.name || apiEntry?.collectionName,
            } as ApiEntry;
            // Save in state, do not notify IDE
            dispatch(saveTagsInStateOnly(tagData));
          }}
          onOptionSelected={(option: SelectOption<ResponseEntry>): void => {
            setApiOption(option);
            const tagData: TagData = {};
            tagData[targetFileName] = {
              apiId: option.value.desc.id,
              apiName: option.value.desc.name,
              collectionId: colOption?.value.desc.id || apiEntry?.collectionId,
              collectionName: colOption?.value.desc.name || apiEntry?.collectionName,
            } as ApiEntry;
            dispatch(saveTags(tagData));
          }}
        ></SelectPanel>
      )}
    </HeaderContainer>
  );
}

function SelectPanel({
  type,
  apiEntry,
  selectedOptionId,
  getQueryParameter,
  onOptionRemoved,
  onOptionSelected,
}: {
  type: "collection" | "api";
  apiEntry: ApiEntry | undefined;
  selectedOptionId: string | undefined;
  getQueryParameter: () => string;
  onOptionRemoved: () => void;
  onOptionSelected: (option: SelectOption<ResponseEntry>) => void;
}) {
  const { data, error, isLoading } =
    type === "collection"
      ? useGetCollectionsQuery(undefined, refreshOptions)
      : useGetApisFromCollectionQuery(getQueryParameter(), refreshOptions);
  let options: SelectOption<ResponseEntry>[] = [];
  if (data) {
    data.forEach((entry) =>
      options.push({
        id: entry.desc.id,
        value: entry,
        label: entry.desc.name,
      } as SelectOption<ResponseEntry>)
    );
  }
  const option = options?.filter((o) => o.id === selectedOptionId)[0];
  if (option) {
    // Do not suggest the option if it is already selected
    options = options?.filter((o) => o.id !== option.id);
  }
  return (
    <Container>
      <Header>
        {isLoading && (
          <HeaderSpan>
            {"Loading " + (type === "collection" ? "collections" : "APIs") + " from the server..."}
          </HeaderSpan>
        )}
        {!isLoading && <HeaderSpan>{type === "collection" ? "Collection" : "API"}</HeaderSpan>}
        {!isLoading && (
          <CollectionOrApiSearchSelector
            type={type}
            options={options}
            onItemSelected={onOptionSelected}
          />
        )}
      </Header>
      {!isLoading && !error && option && (
        <HeaderOptionPanel
          id={`UUID: ${option.value.desc.id}`}
          name={option.label}
          tags={type === "collection" ? undefined : (option.value as ApiResponseEntry).tags}
          isLoaded={true}
          onOptionRemoved={onOptionRemoved}
        />
      )}
      {!isLoading &&
        !error &&
        !option &&
        apiEntry &&
        ((type === "collection" && apiEntry.collectionId) ||
          (type === "api" && apiEntry.apiId)) && (
          <HeaderOptionPanel
            id={type === "collection" ? apiEntry.collectionId : apiEntry.apiId}
            name={type === "collection" ? apiEntry.collectionName : apiEntry.apiName}
            error={`This ${type} is not found on the server`}
            isLoaded={false}
            onOptionRemoved={onOptionRemoved}
          />
        )}
      <HeaderError>
        {error && (
          <ErrorBanner
            message={"Failed to load " + (type === "collection" ? "collections" : "APIs")}
          >
            HTTPError: Response code {error.code} ({error.message})
          </ErrorBanner>
        )}
      </HeaderError>
    </Container>
  );
}

function HeaderOptionPanel({
  id,
  name,
  error,
  tags,
  isLoaded,
  onOptionRemoved,
}: {
  id: string;
  name: string;
  error?: string;
  tags?: TagResponseEntry[];
  isLoaded: boolean;
  onOptionRemoved: () => void;
}) {
  return (
    <HeaderOptionContainer isLoaded={isLoaded}>
      <HeaderOptionContainerInfo>
        <HeaderOptionSpan>{name}</HeaderOptionSpan>
        <HeaderOptionNoteSpan>UUID: {id}</HeaderOptionNoteSpan>
        {tags && (
          <HeaderOptionContainerTagInfo>
            {tags.length > 0 && <Tags />}
            {tags.map((tagItem: TagResponseEntry, tagItemIndex: number) => {
              return (
                <HeaderOptionTagSpan key={`api-tag-${tagItemIndex}`}>
                  {tagItem.categoryName}: {tagItem.tagName}
                </HeaderOptionTagSpan>
              );
            })}
          </HeaderOptionContainerTagInfo>
        )}
        {!isLoaded && <HeaderOptionErrorSpan>{error}</HeaderOptionErrorSpan>}
      </HeaderOptionContainerInfo>
      <HeaderOptionContainerAction>
        <HeaderOptionRemoverSpan
          onClick={(e) => {
            e.stopPropagation();
            onOptionRemoved();
          }}
        >
          <TrashCan />
        </HeaderOptionRemoverSpan>
      </HeaderOptionContainerAction>
    </HeaderOptionContainer>
  );
}

const Container = styled.div`
  gap: 5px;
  display: flex;
  flex-direction: column;
`;

export const Title = styled.div`
  font-weight: 700;
  margin-bottom: 16px;
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  background-color: var(${ThemeColorVariables.computedOne});
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

export const HeaderOptionContainer = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 50px;
  background-color: var(${ThemeColorVariables.computedOne});
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
  ${({ isLoaded }: { isLoaded: boolean }) =>
    !isLoaded &&
    `
     border-color: var(${ThemeColorVariables.errorBorder});
  `}
`;

export const HeaderOptionContainerInfo = styled.div`
  display: flex;
  flex-direction: column;
  width: 97%;
  gap: 10px;
  padding: 16px;
`;

export const HeaderOptionContainerAction = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const HeaderError = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

export const HeaderSpan = styled.span`
  font-weight: bold;
`;

export const HeaderOptionSpan = styled.span`
  font-weight: bold;
`;

export const HeaderOptionErrorSpan = styled.span`
  color: var(${ThemeColorVariables.errorForeground});
`;

export const HeaderOptionNoteSpan = styled.span`
  font-weight: smaller;
  color: var(${ThemeColorVariables.disabledForeground});
`;

export const HeaderOptionRemoverSpan = styled.span`
  font-weight: bold;
  cursor: pointer;
  padding: 16px;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const HeaderOptionContainerTagInfo = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  > svg {
    margin-left: 3px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const HeaderOptionTagSpan = styled.div`
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 5px;
  padding: 3px;
  font-size: 90%;
`;
