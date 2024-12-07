import styled from "styled-components";
import { Sqg } from "@xliic/common/audit";
import { changeTab, changeFilter, Stats } from "./slice";
import { useAppDispatch } from "./store";

export default function SqgLevelViolations({ sqg, stats }: { sqg: Sqg; stats: Stats }) {
  const dispatch = useAppDispatch();

  const rules = sqg.directives.issueRules ?? [];
  const byIssue = stats.byIssue;

  const found = byIssue.filter((issue) => rules.includes(issue.id));

  if (found.length === 0) {
    return null;
  }

  return (
    <Container>
      <h4>Forbidden issues with problem found</h4>
      {found.map((issue) => (
        <div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dispatch(changeTab("issues"));
              dispatch(changeFilter({ rule: issue.id }));
            }}
          >
            {issue.title}
          </a>
        </div>
      ))}
    </Container>
  );
}

const Container = styled.div`
  > div {
    margin-top: 8px;
    margin-bottom: 8px;
  }
`;
