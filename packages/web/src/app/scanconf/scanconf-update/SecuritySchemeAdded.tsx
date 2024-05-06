import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";

import { SecurityAdded } from "@xliic/scanconf-changes";

export default function SecuritySchemeAdded({ change }: { change: SecurityAdded }) {
  return <Container>{change.schema}</Container>;
}

const Container = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  padding: 8px;
  background-color: var(${ThemeColorVariables.computedOne});
`;
