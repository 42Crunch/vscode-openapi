import { useState } from "react";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { EyeSolid } from "../../../../icons";

export default function CredentialField({
  label,
  value,
  masked,
}: {
  label: string;
  value: string;
  masked?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Field>
      <Label>{label}</Label>
      <Value>{masked && !revealed ? "••••••••" : value}</Value>
      {masked && (
        <RevealButton
          type="button"
          title={revealed ? "Hide" : "Reveal"}
          onClick={() => setRevealed(!revealed)}
        >
          <EyeSolid />
        </RevealButton>
      )}
    </Field>
  );
}

const Field = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
`;

const Label = styled.div`
  font-weight: 600;
  font-size: 90%;
  min-width: 120px;
  color: var(${ThemeColorVariables.foreground});
`;

const Value = styled.div`
  flex: 1;
  font-size: 90%;
  opacity: 0.8;
  word-break: break-all;
`;

const RevealButton = styled.button`
  cursor: pointer;
  background: transparent;
  color: var(${ThemeColorVariables.foreground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  padding: 4px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:focus {
    outline: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  > svg {
    height: 14px;
    width: 14px;
    min-width: 14px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;
