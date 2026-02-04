import styled from "styled-components";
import { useState } from "react";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import { Plus } from "../../../icons";
import AuthorizationTestCombo from "./AuthorizationTestCombo";

export default function AddAuthorizationTest({
  authorizationTests,
  auth,
  existing,
  credentials,
  onSelect,
}: {
  authorizationTests: Playbook.AuthorizationTests;
  auth: string[] | undefined;
  credentials: Playbook.Credentials;
  existing: string[];
  onSelect: (test: string) => void;
}) {
  const [showCombo, setShowCombo] = useState(false);

  const applicableTestNames = Object.entries(authorizationTests)
    .filter(([name, test]) => isMatchingAuth(credentials, auth, test.source[0]))
    .map(([name]) => name);

  const availableTests = applicableTestNames.filter((test) => !existing.includes(test));

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

function isMatchingAuth(
  credentials: Playbook.Credentials,
  auths: string[] | undefined,
  credential: string
): boolean {
  // auth entries can be either in short form "credential" or longer form "credential/credentialValue"
  // we need to check for both
  return (
    auths !== undefined &&
    auths.some((auth) => {
      const defaultCredentialName = credentials[auth]?.default;
      return credential === auth || credential === `${auth}/${defaultCredentialName}`;
    })
  );
}
