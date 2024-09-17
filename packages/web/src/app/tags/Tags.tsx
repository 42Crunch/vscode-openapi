import { TagData } from "@xliic/common/tags";
import React from "react";
import styled from "styled-components";
import { RadioGroup2 } from "../../components/RadioGroup";
import { BindPanel } from "./BindPanel";
import { useAppSelector } from "./store";
import { TagsPanel } from "./TagsPanel";

export function RootContainer() {
  const { targetFileName, tagData } = useAppSelector((state) => state.tags);
  const { platformApiToken } = useAppSelector((state) => state.config.data);

  if (platformApiToken && targetFileName && tagData) {
    return <SelectionPanel targetFileName={targetFileName} tagData={tagData}></SelectionPanel>;
  } else {
    return <></>;
  }
}

export function SelectionPanel({
  targetFileName,
  tagData,
}: {
  targetFileName: string;
  tagData: TagData;
}) {
  const data = tagData[targetFileName];
  const [selectionOption, setSelectionOption] = React.useState<string>(
    data === null || Array.isArray(data) ? "option-select-tag" : "option-bind-api"
  );
  return (
    <Container>
      <Title>Select Tag or Bind to API</Title>
      <RadioGroup2
        value={selectionOption}
        options={[
          { value: "option-select-tag", label: "Select Tag" },
          { value: "option-bind-api", label: "Bind to API" },
        ]}
        onValueChange={(value: string) => {
          setSelectionOption(value);
        }}
      />
      {selectionOption === "option-select-tag" && (
        <TagsPanel targetFileName={targetFileName} tagData={tagData} />
      )}
      {selectionOption === "option-bind-api" && (
        <BindPanel targetFileName={targetFileName} tagData={tagData} />
      )}
    </Container>
  );
}

export const Title = styled.div`
  font-weight: 700;
  margin-bottom: 16px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;
