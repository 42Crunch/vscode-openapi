import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useFeatureSelector } from "./slice";

export default function LogMessages() {
  const messages = useFeatureSelector((state) => state.logging.messages);

  const filtered = messages.filter((message) => true); // FIXME implement filtering

  if (filtered.length === 0) {
    return null;
  }

  return (
    <LogText>
      {filtered.map((message, index, array) => (
        <div key={index}>
          <Peg first={index === 0} last={index === array.length - 1} />
          <div>{message.message}</div>
        </div>
      ))}
    </LogText>
  );
}

function Peg({ first, last }: { first: boolean; last: boolean }) {
  return (
    <PegContainer first={first} last={last}>
      <div />
      <div />
      <div />
    </PegContainer>
  );
}

const LogText = styled.div`
  color: var(${ThemeColorVariables.foreground});
  background-color: var(${ThemeColorVariables.background});
  line-break: anywhere;
  padding: 8px;

  > div {
    display: flex;
    align-items: center;
    font-family: monospace;
    > div:last-child {
      padding: 4px 0px 4px 4px;
    }
  }
`;

const PegContainer = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  align-self: stretch;
  > div:first-child {
    width: 1px;
    height: 8px;
    ${({ first }: { first: boolean; last: boolean }) =>
      !first && `background-color: var(${ThemeColorVariables.border});`}
  }
  > div:nth-child(2) {
    background-color: var(${ThemeColorVariables.border});
    border: 1px solid var(${ThemeColorVariables.border});
    border-radius: 50%;
    width: 6px;
    height: 6px;
  }
  > div:last-child {
    flex: 1;
    width: 1px;
    ${({ last }: { first: boolean; last: boolean }) =>
      !last && `background-color: var(${ThemeColorVariables.border});`}
  }
`;
