import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import Scan from "./scan.mdx";

export default function Help() {
  return (
    <Container>
      <Scan />
    </Container>
  );
}

const Container = styled.div`
  background-color: var(${ThemeColorVariables.background});
  padding: 16px;
  overflow-y: scroll;

  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  overflow-y: auto;
`;
