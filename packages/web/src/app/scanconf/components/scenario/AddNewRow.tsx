import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function AddNewRow({ append }: { append: any }) {
  return (
    <Container>
      <Name
        placeholder="Add new entry"
        value=""
        onChange={(e) => {
          append({ key: e.target.value, value: "", type: "string" }, { shouldFocus: true });
        }}
      />
      <Placeholder />
    </Container>
  );
}

const Container = styled.div`
  display: contents;
`;

const Name = styled.input`
  background: transparent;
  border: none;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  margin-right: 10px;
  padding: 4px 8px;
  &::placeholder {
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
`;

const Placeholder = styled.div`
  grid-column: span 3;
`;
