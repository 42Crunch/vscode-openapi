import { useEffect, useRef } from "react";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function KdbArticle({
  article,
  lang,
  openLink,
}: {
  article: any;
  lang: "json" | "yaml";
  openLink: (url: string) => void;
}) {
  const onLinkClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    openLink(e.target.href);
  };

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const links = ref.current!.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", onLinkClick);
    });
    return () => {
      links.forEach((link) => {
        link.removeEventListener("click", onLinkClick);
      });
    };
  });

  const html = [
    article ? article.description.text : "",
    partToText(article.example, lang),
    partToText(article.exploit, lang),
    partToText(article.remediation, lang),
  ].join("");

  return <Container ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function partToText(part: any, lang: "json" | "yaml"): string {
  if (!part || !part.sections) {
    return "";
  }

  return part.sections
    .map((section: any) => {
      if (section.text) {
        return section.text;
      }
      if (section.code) {
        const code = section.code[lang];
        return `<pre>${code}</pre>`;
      }
    })
    .join("");
}

const Container = styled.div`
  padding: 8px;
  weight: 500;
  font-size: var(${ThemeColorVariables.fontSize});

  > h2 {
    margin: 0;
    font-weight: 700;
    font-size: var(${ThemeColorVariables.fontSize});
  }

  & code {
    color: var(${ThemeColorVariables.foreground});
    font-family: monospace;
  }

  > pre {
    background-color: var(${ThemeColorVariables.computedOne});
    padding: 8px 4px;
    white-space: pre-wrap;
    word-break: break-all;
  }
`;
