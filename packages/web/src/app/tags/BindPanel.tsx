import { ApiEntry, TagData } from "@xliic/common/tags";
import { ThemeColorVariables } from "@xliic/common/theme";
import React from "react";
import styled from "styled-components";
import { ErrorBanner } from "../../components/Banner";
import { SelectOption } from "./SearchSelector";
import { CollectionOrApiSearchSelector } from "./Selectors";
import { saveTags, saveTagsInStateOnly } from "./slice";
import { useAppDispatch } from "./store";
import { useGetApisFromCollectionQuery, useGetCollectionsQuery } from "./tags-api";
import { ApiResponseEntry, ResponseEntry, TagResponseEntry } from "./types";
import Tags from "../../icons/Tags";

type SelectOptionState = SelectOption<ResponseEntry> | undefined;

export function BindPanel({
  targetFileName,
  tagData,
}: {
  targetFileName: string;
  tagData: TagData;
}) {
  const dispatch = useAppDispatch();
  const targetData = tagData[targetFileName];
  // Previously selected ids from IDE
  const initApiId = Array.isArray(targetData) ? undefined : targetData?.apiId;
  const initColId = Array.isArray(targetData) ? undefined : targetData?.collectionId;
  const initColName = Array.isArray(targetData) ? undefined : targetData?.collectionName;
  // Current manually selected options
  const [colOption, setColOption] = React.useState<SelectOptionState>(undefined);
  const [apiOption, setApiOption] = React.useState<SelectOptionState>(undefined);
  const showApiSelector = colOption || initColId;
  return (
    <HeaderContainer>
      <SelectPanel
        type="collection"
        selectedOptionId={colOption ? colOption.id : initColId}
        getQueryParameter={() => ""}
        onOptionRemoved={(option: SelectOption<ResponseEntry>): void => {
          setApiOption(undefined);
          setColOption(undefined);
          dispatch(saveTags({ [targetFileName]: null }));
        }}
        onOptionSelected={(option: SelectOption<ResponseEntry>): void => {
          setColOption(option);
        }}
      ></SelectPanel>

      {showApiSelector && (
        <SelectPanel
          type="api"
          selectedOptionId={apiOption ? apiOption.id : initApiId}
          getQueryParameter={() => (colOption ? colOption.value.desc.id : initColId) as string}
          onOptionRemoved={(option: SelectOption<ResponseEntry>): void => {
            setApiOption(undefined);
            const tagData: TagData = {};
            tagData[targetFileName] = {
              apiId: "",
              apiName: "",
              collectionId: colOption?.value.desc.id || initColId,
              collectionName: colOption?.value.desc.name || initColName,
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
              collectionId: colOption?.value.desc.id || initColId,
              collectionName: colOption?.value.desc.name || initColName,
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
  selectedOptionId,
  getQueryParameter,
  onOptionRemoved,
  onOptionSelected,
}: {
  type: "collection" | "api";
  selectedOptionId: string | undefined;
  getQueryParameter: () => string;
  onOptionRemoved: (option: SelectOption<ResponseEntry>) => void;
  onOptionSelected: (option: SelectOption<ResponseEntry>) => void;
}) {
  const { data, error, isLoading } =
    type === "collection"
      ? useGetCollectionsQuery()
      : useGetApisFromCollectionQuery(getQueryParameter());
  const options: SelectOption<ResponseEntry>[] = [];
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
  return (
    <Container>
      <Header>
        {isLoading && (
          <HeaderSpan>
            {"Loading " + (type === "collection" ? "collections" : "APIs") + " from the server..."}
          </HeaderSpan>
        )}
        {!isLoading && (
          <HeaderSpan>{"Select " + (type === "collection" ? "collection" : "API")}</HeaderSpan>
        )}
        {!isLoading && (
          <CollectionOrApiSearchSelector
            type={type}
            options={options}
            onItemSelected={onOptionSelected}
          />
        )}
      </Header>
      {!isLoading && option && (
        <HeaderOptionContainer>
          <HeaderOptionContainerInfo>
            <HeaderOptionSpan>{option.label}</HeaderOptionSpan>
            <HeaderOptionNoteSpan>UUID: {option.value.desc.id}</HeaderOptionNoteSpan>
            {type === "api" && (
              <HeaderOptionContainerTagInfo>
                {(option.value as ApiResponseEntry).tags.length > 0 && <Tags />}
                {(option.value as ApiResponseEntry).tags.map(
                  (tagItem: TagResponseEntry, tagItemIndex: number) => {
                    return (
                      <HeaderOptionTagSpan key={`api-tag-${tagItemIndex}`}>
                        {tagItem.categoryName}: {tagItem.tagName}
                      </HeaderOptionTagSpan>
                    );
                  }
                )}
              </HeaderOptionContainerTagInfo>
            )}
          </HeaderOptionContainerInfo>
          <HeaderOptionContainerAction>
            <HeaderOptionRemoverSpan
              onClick={(e) => {
                e.stopPropagation();
                onOptionRemoved(option);
              }}
            >
              &#10005;
            </HeaderOptionRemoverSpan>
          </HeaderOptionContainerAction>
        </HeaderOptionContainer>
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
`;

const HeaderOptionContainer = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 50px;
  background-color: var(${ThemeColorVariables.computedOne});
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
`;

const HeaderOptionContainerInfo = styled.div`
  display: flex;
  flex-direction: column;
  width: 97%;
  gap: 10px;
  padding: 10px;
`;

const HeaderOptionContainerAction = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const HeaderError = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const HeaderSpan = styled.span`
  font-weight: bold;
  padding: 17px;
`;

const HeaderOptionSpan = styled.span`
  font-weight: bold;
`;

const HeaderOptionNoteSpan = styled.span`
  font-weight: smaller;
  color: var(${ThemeColorVariables.disabledForeground});
`;

const HeaderOptionRemoverSpan = styled.span`
  font-weight: bold;
  cursor: pointer;
  padding: 1px;
`;

const HeaderOptionContainerTagInfo = styled.div`
  display: flex;
  flex-direction: row;
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
`;
