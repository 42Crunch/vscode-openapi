import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Link } from "../../icons";
import { FlatIssue, goToLine } from "./slice";
import { useAppDispatch } from "./store";
import { useState } from "react";

export function Locations({ issueId, issues }: { issueId: string; issues: FlatIssue[] }) {
  const dispatch = useAppDispatch();

  const [expanded, setExpanded] = useState(false);
  const matching = issues.filter((issue) => issue.id === issueId);
  const maxDisplayed = expanded ? matching.length : 4;
  const displayed = matching.slice(0, maxDisplayed);

  displayed.sort((a, b) => {
    const filename = a.filename.localeCompare(b.filename);
    if (filename === 0) {
      return a.lineNo - b.lineNo;
    }
    return filename;
  });

  return (
    <Container>
      <h2>{matching.length} results with this issue</h2>
      <div>
        {displayed.map((issue) => (
          <Location key={`${issue.filename}:${issue.lineNo}`}>
            <Link />
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(
                  goToLine({
                    uri: issue.documentUri,
                    line: issue.lineNo,
                    pointer: issue.pointer,
                  })
                );
              }}
            >
              {issue.filename}:{issue.lineNo + 1}
            </a>
          </Location>
        ))}
      </div>
      {!expanded && matching.length > displayed.length && (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(true);
          }}
        >
          Show {matching.length - displayed.length} more
        </a>
      )}
      {expanded && (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(false);
          }}
        >
          Show less
        </a>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding-top: 8px;
  padding-left: 8px;
  > h2 {
    margin: 0;
    font-weight: 700;
    font-size: var(${ThemeColorVariables.fontSize});
  }
  > div {
    margin-top: 8px;
    margin-bottom: 8px;
  }
`;
const Location = styled.div`
  display: flex;
  align-items: center;
  margin: 4px;
  gap: 4px;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;
