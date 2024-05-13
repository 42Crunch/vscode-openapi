import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { RefObject, useEffect, useRef, useState } from "react";

import Scan from "./scan.mdx";

export default function Help() {
  const documentRef = useRef(null);
  const headings = useToc(documentRef);

  return (
    <>
      <Sidebar>
        {headings.map((heading, index) =>
          heading.level === 1 ? (
            <Title
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                heading.element.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {heading.title}
            </Title>
          ) : (
            <Subtitle
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                heading.element.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {heading.title}
            </Subtitle>
          )
        )}
      </Sidebar>
      <Content ref={documentRef} expanded>
        <Scan />
      </Content>
    </>
  );
}

type Toc = {
  title: string;
  element: HTMLHeadingElement;
  level: 1 | 2;
};

const useToc = (ref: RefObject<HTMLElement>): Toc[] => {
  const [toc, setToc] = useState<Toc[]>([]);
  useEffect(() => {
    const result: Toc[] = [];
    if (ref.current !== null) {
      for (const element of ref.current.querySelectorAll<HTMLHeadingElement>("h1, h2")) {
        if ((element.tagName === "H1" || element.tagName === "H2") && element.textContent) {
          const title = element.textContent;
          const level = element.tagName === "H1" ? 1 : 2;
          result.push({ title, element, level });
        }
      }
    }
    setToc(result);
  }, [ref]);

  return toc;
};

const Sidebar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 288px;
  overflow-y: scroll;
  bottom: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: var(${ThemeColorVariables.background});
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 16px;
  padding: 8px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }
`;

const Subtitle = styled.div`
  padding: 4px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  &:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }
`;

const Content = styled.div<{ expanded: boolean }>`
  position: absolute;
  ${({ expanded }) => (expanded ? `left: 320px;` : `left: 40px;`)}
  top: 0;
  right: 0;
  bottom: 0;
  background-color: var(${ThemeColorVariables.computedOne});
  padding: 16px;
  overflow-y: auto;
`;
