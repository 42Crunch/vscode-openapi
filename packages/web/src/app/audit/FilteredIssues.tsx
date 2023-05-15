import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { CriticalityLevelName } from "@xliic/common/audit";

import { Clone, ExclamationCircle, Flag, Link } from "../../icons";
import CollapsibleCard, {
  BottomDescription,
  BottomItem,
  TopDescription,
} from "../../components/CollapsibleCard";
import KdbArticle from "./KdbArticle";
import FilterPanel from "./FilterPanel";
import { copyIssueId, goToLine, openLink } from "./slice";

export default function FilteredIssues() {
  const {
    kdb,
    filtered,
    audit: { filename },
  } = useAppSelector((state) => state.audit);
  const dispatch = useAppDispatch();

  return (
    <Container>
      <FilterPanel />
      {filtered.map((issue, index) => (
        <CollapsibleCard key={`issue-${index}`}>
          <TopDescription>{issue.description}</TopDescription>
          <BottomDescription>
            <BottomDescription>
              <BottomItem>
                <ExclamationCircle /> {CriticalityLevelName[issue.criticality]}
              </BottomItem>
              <BottomItem>
                <Flag /> Score Impact {issue.displayScore}
              </BottomItem>
              <BottomItem>
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
              </BottomItem>
              <BottomItem>
                <Clone />
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(copyIssueId(issue.id));
                  }}
                >
                  Issue ID
                </a>
              </BottomItem>
            </BottomDescription>
          </BottomDescription>
          <KdbArticle
            lang={filename.toLowerCase().endsWith("json") ? "json" : "yaml"}
            article={kdb[issue.id]}
            openLink={(url) => {
              dispatch(openLink(url));
            }}
          />
        </CollapsibleCard>
      ))}
    </Container>
  );
}

const Container = styled.div``;
