import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function AddNewRow({ append }: { append: any }) {
  return (
    <Container>
      <Name
        placeholder="name"
        value=""
        onChange={(e) => {
          append(
            {
              key: e.target.value,
              value: {
                name: "SCAN42C_",
                default: "",
                required: false,
                from: "environment",
              },
            },
            { shouldFocus: true }
          );
        }}
      />
    </Container>
  );
}

const Container = styled.div`
  grid-column: span 5;
  display: flex;
`;

const Name = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  padding: 4px 8px;
`;
