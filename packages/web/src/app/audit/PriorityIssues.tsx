import styled from "styled-components";

import { CriticalityLevelName } from "@xliic/common/audit";

import { useAppDispatch, useAppSelector } from "./store";

import { Clone, ExclamationCircle, Flag, Link } from "../../icons";
import CollapsibleCard, {
  BottomDescription,
  BottomItem,
  TopDescription,
} from "../../components/CollapsibleCard";
import KdbArticle from "./KdbArticle";
import { Locations } from "./Locations";
import { copyIssueId, openLink } from "./slice";

export default function PriorityIssues() {
  const {
    stats,
    issues,
    audit: { filename },
  } = useAppSelector((state) => state.audit);

  const dispatch = useAppDispatch();

  // domains
  // ApiSecurityAuditDomainType.Data,
  // ApiSecurityAuditDomainType.Security,
  // ApiSecurityAuditDomainType.Validation

  // merge all issues
  // pick issues of this crits: Criticality.Critical, Criticality.High, Criticality.Medium, Criticality.Low
  // group by issue type, id?
  // sort resulting groups by number of issues => mostCommonIssuesGroups
  // sort resulting groups by total score of the group => biggestScoreContributionIssuesGroups
  // priority issues are:
  // max 4 of issues from: {mostCommonIssuesGroups, biggestScoreContributionIssues}

  const mostCommon = stats.byIssue
    .filter((group) => group.important)
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const biggestImpact = stats.byIssue
    .filter((group) => group.important)
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <Container>
      <GroupTitle>Most common issues</GroupTitle>
      {mostCommon.map((issue, index) => (
        <CollapsibleCard key={`issue-${index}`}>
          <TopDescription>{issue.title}</TopDescription>
          <BottomDescription>
            <BottomDescription>
              <BottomItem>
                <ExclamationCircle /> {CriticalityLevelName[issue.criticality]}
              </BottomItem>
              <BottomItem>
                <Flag /> Score impact: {issue.displayScore}
              </BottomItem>
              <BottomItem>
                <Link /> {issue.count} result(s)
              </BottomItem>
              <BottomItem>
                <Clone />{" "}
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
          <div>
            <Locations issueId={issue.id} issues={issues} />
            <KdbArticle
              lang={filename.toLowerCase().endsWith("json") ? "json" : "yaml"}
              article={issue.kdb}
              openLink={(url) => dispatch(openLink(url))}
            />
          </div>
        </CollapsibleCard>
      ))}
      <GroupTitle>Opportunities</GroupTitle>
      {biggestImpact.map((issue, index) => (
        <CollapsibleCard key={`issue-${index}`}>
          <TopDescription>{issue.title}</TopDescription>
          <BottomDescription>
            <BottomDescription>
              <BottomItem>
                <ExclamationCircle /> Count {issue.count}
              </BottomItem>
              <BottomItem>
                <Flag /> Score impact: {issue.displayScore}
              </BottomItem>
              <BottomItem>
                <Link /> {issue.count} result(s)
              </BottomItem>
            </BottomDescription>
          </BottomDescription>
          <div>
            <Locations issueId={issue.id} issues={issues} />
            <KdbArticle
              lang={filename.toLowerCase().endsWith("json") ? "json" : "yaml"}
              article={issue.kdb}
              openLink={(url) => dispatch(openLink(url))}
            />
          </div>
        </CollapsibleCard>
      ))}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
`;

const GroupTitle = styled.div`
  margin: 14px;
  font-size: 12px;
  font-weight: 500;
`;
