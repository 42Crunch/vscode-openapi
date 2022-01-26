import Article from "./Article";
import { Issue as IssueType } from "../types";
import { ReactComponent as ChevronUp } from "./icons/chevron-up.svg";
import { ReactComponent as ChevronDown } from "./icons/chevron-down.svg";

import { useState } from "react";

export default function Issue({
  kdb,
  issue,
  goToLine,
  copyIssueId,
  openLink,
}: {
  kdb: any;
  issue: IssueType;
  goToLine: any;
  copyIssueId: any;
  openLink: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const scoreImpact = issue.displayScore !== "0" ? `Score impact: ${issue.displayScore}` : "";
  const lang =
    issue.filename.toLowerCase().endsWith(".yaml") || issue.filename.toLowerCase().endsWith("yml")
      ? "yaml"
      : "json";
  return (
    <div className="c_roundedbox_section">
      <h1 onClick={toggle} style={{ cursor: "pointer" }}>
        {isOpen ? (
          <ChevronUp
            style={{
              width: 24,
              height: 24,
              marginRight: 8,
              fill: "var(--audit-foreground)",
            }}
          />
        ) : (
          <ChevronDown
            style={{
              width: 24,
              height: 24,
              marginRight: 8,
              fill: "var(--audit-foreground)",
            }}
          />
        )}
        {issue.description}
      </h1>

      <p>
        <small>
          Issue ID:{" "}
          <span
            className="issue-id"
            onClick={(e) => {
              copyIssueId(issue.id);
            }}
          >
            {issue.id}
          </span>
        </small>
      </p>
      <p>
        <small>
          <a
            className="focus-line"
            href="#"
            onClick={(e) => {
              goToLine(issue.documentUri, issue.lineNo, issue.pointer);
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {issue.filename}:{issue.lineNo}
          </a>
          . Severity: {criticalityNames[issue.criticality]}. {scoreImpact}
        </small>
      </p>

      {isOpen && <Article kdb={kdb} articleId={issue.id} lang={lang} openLink={openLink} />}
    </div>
  );
}

const criticalityNames = {
  5: "Critical",
  4: "High",
  3: "Medium",
  2: "Low",
  1: "Info",
};
