import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useFeatureSelector } from "./slice";
import { useEffect, useRef, useState } from "react";

export default function SmallLogMessages() {
  const messages = useFeatureSelector((state) => state.logging.messages);

  const filtered = messages.filter((message) => true);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrolledManually, setScrolledManually] = useState(false);

  useEffect(() => {
    if (containerRef.current && !scrolledManually) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filtered, scrolledManually]);

  if (filtered.length === 0) {
    return null;
  }

  const handleScroll = () => {
    const container = containerRef.current;

    if (container) {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      if (scrollHeight - (scrollTop + clientHeight) < 10) {
        setScrolledManually(false);
      } else {
        setScrolledManually(true);
      }
    }
  };

  return (
    <Container>
      <LogText ref={containerRef} onScroll={handleScroll}>
        {filtered.map((message, index, array) => (
          <div key={index}>
            <Peg first={index === 0} last={index === array.length - 1} />
            <div>{message.message}</div>
          </div>
        ))}
      </LogText>
    </Container>
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
  overflow-y: scroll;
  max-height: 200px;

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

const Container = styled.div`
  padding: 8px;
  margin: 8px;
  border-radius: 2px;
  border: 1px solid var(${ThemeColorVariables.border});
`;
