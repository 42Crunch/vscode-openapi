import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { SeverityLevel, SeverityLevelOrNone, SeverityLevels, Sqg } from "@xliic/common/audit";
import { changeTab, changeFilter, SeverityStats, Stats, Filter } from "./slice";
import { useAppDispatch } from "./store";

export default function SqgLevelViolations({ sqg, stats }: { sqg: Sqg; stats: Stats }) {
  const dispatch = useAppDispatch();

  const rules = sqg.directives.subcategoryRules;
  const byGroup = stats.byGroup;

  const violations = {
    security: [
      {
        name: "Authentication",
        domain: "security",
        group: "authentication",
        level: rules.security.authentication,
        violations: checkViolations(rules.security.authentication, byGroup.security.authentication),
      },
      {
        name: "Authorization",
        domain: "security",
        group: "authorization",
        level: rules.security.authorization,
        violations: checkViolations(rules.security.authorization, byGroup.security.authorization),
      },
      {
        name: "Transport",
        domain: "security",
        group: "transport",
        level: rules.security.transport,
        violations: checkViolations(rules.security.transport, byGroup.security.transport),
      },
    ],
    data: [
      {
        name: "Paths",
        domain: "datavalidation",
        group: "paths",
        level: rules.dataValidation.paths,
        violations: checkViolations(rules.dataValidation.paths, byGroup.datavalidation.paths),
      },
      {
        name: "Parameters",
        domain: "datavalidation",
        group: "parameters",
        level: rules.dataValidation.parameters,
        violations: checkViolations(
          rules.dataValidation.parameters,
          stats.byGroup.datavalidation.parameters
        ),
      },
      {
        name: "Schema",
        domain: "datavalidation",
        group: "schema",
        level: rules.dataValidation.schema,
        violations: checkViolations(rules.dataValidation.schema, byGroup.datavalidation.schema),
      },
      {
        name: "Response Definition",
        domain: "datavalidation",
        group: "responsedefinition",
        level: rules.dataValidation.responseDefinition,
        violations: checkViolations(
          rules.dataValidation.responseDefinition,
          byGroup.datavalidation.responsedefinition
        ),
      },
      {
        name: "Response Headers",
        domain: "datavalidation",
        group: "responseheader",
        level: rules.dataValidation.responseHeaders,
        violations: checkViolations(
          rules.dataValidation.responseHeaders,
          byGroup.datavalidation.responseheader
        ),
      },
    ],
  };

  return (
    <Container>
      <h4>Allowed issue security levels</h4>
      <Header>
        <div>Category</div>
        <div>threshold</div>
        <div>issues found</div>
      </Header>

      <Subheader>Security</Subheader>

      {violations.security
        .filter((entry) => entry.violations.length > 0)
        .map((entry, index) => (
          <Content key={index}>
            <div>{entry.name}</div>
            <div>{getLevelDescription(entry.level)}</div>
            <a
              href="#"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                dispatch(changeTab("issues"));
                dispatch(
                  changeFilter({
                    severity: entry.violations[0].level,
                    domain: entry.domain as Filter["domain"],
                    group: entry.group as Filter["group"],
                  })
                );
              }}
            >
              {entry.violations.map((entry) => `${entry.level} ${entry.count}`).join(", ")}
            </a>
          </Content>
        ))}

      <Subheader>Data validation</Subheader>
      {violations.data
        .filter((entry) => entry.violations.length > 0)
        .map((entry, index) => (
          <Content key={index}>
            <div>{entry.name}</div>
            <div>{getLevelDescription(entry.level)}</div>
            <a
              href="#"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                dispatch(changeTab("issues"));
                dispatch(
                  changeFilter({
                    severity: entry.violations[0].level,
                    domain: entry.domain as Filter["domain"],
                    group: entry.group as Filter["group"],
                  })
                );
              }}
            >
              {entry.violations.map((entry) => `${entry.level} ${entry.count}`).join(", ")}
            </a>
          </Content>
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

const Subheader = styled.div`
  display: flex;
  background-color: var(${ThemeColorVariables.computedOne});
  border-radius: 2px;
  padding: 8px;
`;

const Content = styled.div`
  display: flex;
  > a {
    flex: 1;
    text-transform: capitalize;
    margin: 8px;
  }
  > div {
    flex: 1;
    margin: 8px;
  }
`;

function checkViolations(
  level: SeverityLevelOrNone,
  stats: SeverityStats
): { level: SeverityLevel; count: number }[] {
  if (level === "none") {
    // there could be no violations at level none
    return [];
  }
  const start = SeverityLevels.indexOf(level);
  const result = [];
  for (const name of SeverityLevels.slice(start)) {
    if (stats[name] > 0) {
      result.push({ level: name, count: stats[name] });
    }
  }
  return result;
}

const levelDescriptions = {
  info: "All issues are rejected",
  low: "Issues up to level Info allowed, levels Low to Critical rejected",
  medium: "Issues up to level Low allowed, levels Medium to Critical rejected",
  high: "Issues up to level Medium allowed, levels High to Critical rejected",
  critical: "Only Critical issues are rejected",
  none: "No restrictions",
};

function getLevelDescription(level: SeverityLevelOrNone) {
  return levelDescriptions[level];
}
