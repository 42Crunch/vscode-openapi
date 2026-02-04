import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { Menu, MenuItem } from "../../../new-components/Menu";
import { TrashCan } from "../../../icons";

export default function AuthorizationTests({
  authorizationTests,
  removeTest,
}: {
  authorizationTests: string[];
  removeTest: (test: string) => void;
}) {
  return (
    <Container>
      {authorizationTests.map((test, index) => (
        <Test key={index}>
          <div>{test}</div>
          <Menu>
            <MenuItem onClick={(e) => e.stopPropagation()} onSelect={() => removeTest(test)}>
              <TrashCan />
              Delete
            </MenuItem>
          </Menu>
        </Test>
      ))}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Test = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  background-color: var(${ThemeColorVariables.background});
  padding: 8px;
  display: flex;
  div:first-child {
    flex: 1;
  }
  .menu {
    opacity: 0;
  }
  &:hover {
    .menu {
      opacity: 1;
    }
  }
`;
