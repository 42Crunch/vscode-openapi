import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { useState } from "react";
import { Plus } from "../../../../icons";
import AuthorizationTestCombo from "./AuthorizationTestCombo";

export default function AddAuthorizationTest({
  authorizationTests,
  existing,
  onSelect,
}: {
  authorizationTests: string[];
  existing: string[];
  onSelect: (test: string) => void;
}) {
  const [showCombo, setShowCombo] = useState(false);

  const availableTests = authorizationTests.filter((test) => !existing.includes(test));

  return showCombo ? (
    <AuthorizationTestCombo
      onSelect={(selected) => {
        if (selected !== undefined) {
          onSelect(selected);
        }
        setShowCombo(false);
      }}
      authorizationTests={availableTests}
    />
  ) : (
    <Container
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowCombo(true);
      }}
    >
      <Plus /> Add authorization test
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  cusror: pointer;
  border: 1px dashed var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
