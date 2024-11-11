import { TagData } from "@xliic/common/tags";
import React, { useEffect } from "react";
import styled from "styled-components";
import RadioGroup from "../../new-components/RadioGroup";
import { ApiPanel } from "./ApiPanel";
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
  useEffect(() => {
    // Recalc selection option value if targetFileName has been changed
    setSelectionOption(
      data === null || Array.isArray(data) ? "option-select-tag" : "option-bind-api"
    );
  }, [targetFileName]);
  return (
    <Container>
      <Title>Specify tags, or link the platform API to {targetFileName}</Title>
      <RadioGroup
        value={selectionOption}
        options={[
          { value: "option-select-tag", label: "Tags" },
          { value: "option-bind-api", label: "Link to API" },
        ]}
        onValueChange={(value: string) => {
          setSelectionOption(value);
        }}
      />
      {selectionOption === "option-select-tag" && (
        <TagsPanel targetFileName={targetFileName} tagData={tagData} />
      )}
      {selectionOption === "option-bind-api" && (
        <ApiPanel targetFileName={targetFileName} tagData={tagData} />
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
