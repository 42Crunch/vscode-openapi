import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Sqg, Summary } from "@xliic/common/audit";

export default function SqgDetails({ sqg, summary }: { sqg: Sqg; summary: Summary }) {
  const minimum = sqg.directives.minimumAssessmentScores;
  const rules = sqg.directives.subcategoryRules;
  const issueRules = sqg.directives.issueRules;

  return (
    <Container>
      <h4>Minimum acceptable score</h4>
      <Header>
        <div>Score</div>
        <div>current</div>
        <div>Minimum acceptable</div>
      </Header>
      <Content>
        <div>Global score</div>
        <Score highlight={summary.all < minimum.global}>{summary.all}</Score>
        <Score>{minimum.global}</Score>
      </Content>
      <Content>
        <div>Security score</div>
        <Score highlight={summary.security.value < minimum.security}>
          {summary.security.value}
        </Score>
        <Score>{minimum.security}</Score>
      </Content>
      <Content>
        <div>Data validation score</div>
        <Score highlight={summary.datavalidation.value < minimum.dataValidation}>
          {summary.datavalidation.value}
        </Score>
        <Score>{minimum.dataValidation}</Score>
      </Content>
    </Container>
  );
}

const Container = styled.div``;

const Header = styled.div`
  display: flex;
  background-color: var(${ThemeColorVariables.computedTwo});
  border-radius: 2px;
  padding: 8px;
  > div {
    flex: 1;
    text-transform: uppercase;
    font-weight: 600;
    font-size: 12px;
  }
`;

const Content = styled.div`
  display: flex;
  > div {
    flex: 1;
    margin: 8px;
  }
`;

const Score = styled.div<{ highlight?: boolean }>`
  ${({ highlight }) => highlight && "font-weight: 700;"}
`;
