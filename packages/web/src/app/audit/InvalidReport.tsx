import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { ExclamationCircle } from "../../icons";

export default function InvalidReport({ onShowIssues }: { onShowIssues: () => void }) {
  return (
    <Container
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onShowIssues();
      }}
    >
      <Top>
        <ExclamationCircle />
        <div>
          Your API has structural or semantic issues in its OpenAPI format. Fix these issues first
          and run Security Audit again to get the full audit report. Click <a href="#">here</a> to
          display the issues.
        </div>
      </Top>
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  border-radius: 2px;
  border: 1px solid var(${ThemeColorVariables.errorBorder});
  background-color: var(${ThemeColorVariables.errorBackground});
  color: var(${ThemeColorVariables.errorForeground});
  cursor: pointer;
`;

const Top = styled.div`
  display: flex;
  padding: 8px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
  }
  > div:nth-child(2) {
    flex: 1;
  }
`;
