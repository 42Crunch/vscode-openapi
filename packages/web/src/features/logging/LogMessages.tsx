import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useFeatureSelector } from "./slice";
import { useEffect, useRef, useState } from "react";

export default function LogMessages() {
  const messages = useFeatureSelector((state) => state.logging.messages);

  const filtered = messages.filter((message) => message.level == "info");

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
        {filtered.map((message, index) => (
          <div key={index}>{message.message}</div>
        ))}
      </LogText>
    </Container>
  );
}

const LogText = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  background-color: var(${ThemeColorVariables.background});
  border-radius: 2px;
  padding: 0.75rem;
  line-break: anywhere;
  max-height: 200px;
  overflow-y: scroll;
  > div {
    font-family: monospace;
  }
`;

const Container = styled.div`
  padding: 8px;
`;
