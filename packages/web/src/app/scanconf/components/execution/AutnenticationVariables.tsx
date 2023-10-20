import { ThemeColorVariables } from "@xliic/common/theme";
import { BracketsCurly, ExclamationCircle } from "../../../../icons";
import CollapsibleCard, { BottomDescription, BottomItem } from "../CollapsibleCard";
import { VariableReplacement } from "../scenario/types";
import styled from "styled-components";

export function AuthenticationVariables({
  name,
  value,
  variables,
  hasMissing,
}: {
  name: string;
  value?: string;
  hasMissing?: boolean;
  variables: VariableReplacement;
}) {
  return (
    <CollapsibleCard>
      <BottomDescription style={{ gap: "8px" }}>
        <BottomItem>
          <BracketsCurly />
          {name}
          {hasMissing && (
            <ExclamationCircle style={{ fill: `var(${ThemeColorVariables.errorForeground})` }} />
          )}
          {hasMissing && (
            <Missing>
              Missing {variables?.missing?.map((name) => `{{${name}}}`)?.join(", ")}
            </Missing>
          )}
        </BottomItem>
      </BottomDescription>
      <CredentialValue>{value}</CredentialValue>
    </CollapsibleCard>
  );
}

const Missing = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
  border-radius: 4px;
`;

const CredentialValue = styled.div`
  font-family: monospace;
  padding: 8px 4px;
  line-break: anywhere;
`;
