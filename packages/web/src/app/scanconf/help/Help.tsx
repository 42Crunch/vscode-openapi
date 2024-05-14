import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { RefObject, useEffect, useRef, useState } from "react";

import Scan from "./scan.mdx";
import { useAppDispatch } from "../store";
import { openLink } from "../../../features/router/slice";

export default function Help() {
  const documentRef = useRef(null);
  const headings = useToc(documentRef);

  return (
    <>
      <Sidebar>
        {headings.map((heading, index) => (
          <Title
            key={index}
            level={heading.level}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              heading.element.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {heading.title}
          </Title>
        ))}
      </Sidebar>
      <Content ref={documentRef} expanded>
        <Scan components={{ Link }} />
      </Content>
    </>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  return (
    <a
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(openLink(href));
      }}
      href={href}
    >
      {children}
    </a>
  );
}

type Toc = {
  title: string;
  element: HTMLHeadingElement;
  level: 1 | 2 | 3;
};

function getHeadingLevel(tagName: "H1" | "H2" | "H3"): 1 | 2 | 3 {
  switch (tagName) {
    case "H1":
      return 1;
    case "H2":
      return 2;
    case "H3":
      return 3;
  }
}

const useToc = (ref: RefObject<HTMLElement>): Toc[] => {
  const [toc, setToc] = useState<Toc[]>([]);
  useEffect(() => {
    const result: Toc[] = [];
    if (ref.current !== null) {
      for (const element of ref.current.querySelectorAll<HTMLHeadingElement>("h1, h2, h3")) {
        if (element.textContent) {
          const title = element.textContent;
          const level = getHeadingLevel(element.tagName as "H1" | "H2" | "H3");
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

const Title = styled.div<{ level: 1 | 2 | 3 }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }

  ${({ level }) =>
    level === 1 &&
    `
    font-weight: 600;
    font-size: 16px;
    padding: 8px 8px;
  `}

  ${({ level }) =>
    level === 2 &&
    `
    font-weight: 500;
    font-size: 14px;
    padding: 4px 16px;
  `}

  ${({ level }) =>
    level === 3 &&
    `
    font-weight: 400;
    font-size: 12px;
    padding: 4px 32px;
  `}
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
  code {
    background-color: unset;
    padding: 0;
    border-radius: 0;
  }
`;
