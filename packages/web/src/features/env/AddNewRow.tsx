import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function AddNewRow({ append }: { append: any }) {
  return (
    <Container>
      <Name
        placeholder="name"
        value=""
        onChange={(e) => {
          append({ key: e.target.value, value: "" }, { shouldFocus: true });
        }}
      />
      <Placeholder />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
`;

const Name = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  margin-right: 10px;
`;

const Placeholder = styled.div`
  flex: 2;
  border: none;
  background: transparent;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  margin-right: 1.5em;
`;
