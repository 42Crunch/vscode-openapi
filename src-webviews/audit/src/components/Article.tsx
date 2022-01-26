import { useEffect, useRef } from "react";

export default function Article({
  articleId,
  kdb,
  lang,
  openLink,
}: {
  articleId: string;
  kdb: any;
  lang: "json" | "yaml";
  openLink: any;
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

  const article = kdb[articleId] || fallbackArticle;

  const html = [
    article ? article.description.text : "",
    partToText(article.example, lang),
    partToText(article.exploit, lang),
    partToText(article.remediation, lang),
  ].join("");

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
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

const fallbackArticle = {
  description: {
    text: `<p>Whoops! Looks like there has been an oversight and we are missing a page for this issue.</p>
           <p><a href="https://apisecurity.io/contact-us/">Let us know</a> the title of the issue, and we make sure to add it to the encyclopedia.</p>`,
  },
};
