import { useState } from "react";
import styled from "styled-components";
import { useController } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";
import DescriptionTooltip from "../DescriptionTooltip";
import { useFilePicker } from "../../features/file-picker/slice";

// A react-hook-form field whose value is set by picking a file through the IDE
// host. The host reads and base64-encodes the file; the encoded content is
// stored in the form field and the picked file name is shown as a hint.
export default function FileInput({
  label,
  name,
  title,
  extensions,
  description,
}: {
  label: string;
  name: string;
  title: string;
  extensions: string[];
  description?: string;
}) {
  const {
    field,
    fieldState: { error, invalid },
  } = useController({ name });

  const pickFile = useFilePicker();
  const [filename, setFilename] = useState<string | undefined>(undefined);

  const onBrowse = async () => {
    const file = await pickFile(title, extensions);
    if (file !== undefined) {
      field.onChange(file.content);
      setFilename(file.filename);
    }
  };

  const hint =
    filename !== undefined
      ? filename
      : field.value
      ? `${String(field.value).substring(0, 32)}…`
      : "No file selected";

  return (
    <>
      <Container>
        <Inner $invalid={invalid}>
          <Title>
            <div>{label}</div>
            {description && <DescriptionTooltip>{description}</DescriptionTooltip>}
          </Title>
          <Row>
            <Hint $empty={filename === undefined && !field.value}>{hint}</Hint>
            <Browse type="button" onClick={onBrowse}>
              Browse
            </Browse>
          </Row>
        </Inner>
      </Container>
      {error && <Error>{error?.message}</Error>}
    </>
  );
}

const Container = styled.div`
  display: flex;
  flow-direction: column;
  gap: 4px;
  > div:first-child {
    flex: 1;
  }
  > div.description {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Inner = styled.div<{ $invalid?: boolean }>`
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 4px;

  ${({ $invalid }) =>
    $invalid
      ? `border: 1px solid var(${ThemeColorVariables.errorBorder});`
      : `border: 1px solid var(${ThemeColorVariables.border});`}
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Hint = styled.div<{ $empty?: boolean }>`
  flex: 1;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(
    ${({ $empty }) =>
      $empty ? ThemeColorVariables.inputPlaceholderForeground : ThemeColorVariables.foreground}
  );
`;

const Browse = styled.button`
  cursor: pointer;
  border: none;
  padding: 4px 12px;
  border-radius: 2px;
  color: var(${ThemeColorVariables.buttonSecondaryForeground});
  background-color: var(${ThemeColorVariables.buttonSecondaryBackground});
  &:focus {
    outline: none;
  }
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: var(${ThemeColorVariables.inputPlaceholderForeground});
`;

const Error = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
`;
