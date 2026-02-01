import { useState, KeyboardEvent } from "react";
import styled from "styled-components";
import { useController } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Xmark } from "../../icons";

export default function Roles({ label, name }: { label: string; name: string }) {
  const {
    field: { value, onChange },
    fieldState: { error, invalid },
  } = useController({ name });

  const roles: string[] = value ?? [];
  const [input, setInput] = useState("");

  const addRole = () => {
    const trimmed = input.trim();
    if (trimmed !== "" && !roles.includes(trimmed)) {
      onChange([...roles, trimmed]);
    }
    setInput("");
  };

  const removeRole = (role: string) => {
    onChange(roles.filter((r) => r !== role));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRole();
    } else if (e.key === "Backspace" && input === "" && roles.length > 0) {
      removeRole(roles[roles.length - 1]);
    }
  };

  return (
    <>
      <Container>
        <Inner $invalid={invalid}>
          <Title>{label}</Title>
          <TagArea>
            {roles.map((role) => (
              <TagItem key={role}>
                <span>{role}</span>
                <RemoveButton type="button" onClick={() => removeRole(role)}>
                  <Xmark />
                </RemoveButton>
              </TagItem>
            ))}
            <TagInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={addRole}
              placeholder={roles.length === 0 ? "Type a role and press Enter" : ""}
            />
          </TagArea>
        </Inner>
      </Container>
      {error && <Error>{error?.message}</Error>}
    </>
  );
}

const Container = styled.div`
  display: flex;
  flow-direction: column;
  gap: 4px;
  > div:first-child {
    flex: 1;
  }
`;

const Inner = styled.div<{ $invalid?: boolean }>`
  min-height: 40px;
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 4px;

  ${({ $invalid }) =>
    $invalid
      ? `border: 1px solid var(${ThemeColorVariables.errorBorder});`
      : `border: 1px solid var(${ThemeColorVariables.border});
         &:focus-within {
           border: 1px solid var(${ThemeColorVariables.focusBorder});
         }
      `}
`;

const Title = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: var(${ThemeColorVariables.inputPlaceholderForeground});
`;

const TagArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  border-radius: 2px;
  font-size: 12px;
  line-height: 20px;
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  > svg {
    width: 10px;
    height: 10px;
    fill: var(${ThemeColorVariables.badgeForeground});
  }
`;

const TagInput = styled.input`
  flex: 1;
  min-width: 60px;
  background: transparent;
  line-height: 20px;
  border: none;
  padding: 0;
  color: var(${ThemeColorVariables.foreground});
  &::placeholder {
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
  &:focus {
    outline: none;
  }
`;

const Error = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
`;
