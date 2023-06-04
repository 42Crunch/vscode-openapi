import styled from "styled-components";
import { useState } from "react";
import { AuditCompliance, Summary } from "@xliic/common/audit";
import { ThemeColorVariables } from "@xliic/common/theme";

import SqgList from "./SqgList";
import SqgDetails from "./SqgDetails";
import SqgLogLevelViolations from "./SqgLevelViolations";
import SqgRuleViolations from "./SqgRuleViolations";

import { Stats } from "./slice";

export default function Compliance({
  compliance,
  summary,
  stats,
}: {
  compliance: AuditCompliance;
  summary: Summary;
  stats: Stats;
}) {
  const [selected, setSelected] = useState(0);
  const sqg = compliance.sqgsDetail[selected];

  return (
    <Container>
      <SqgList
        sqgs={compliance.sqgsDetail}
        onSelect={setSelected}
        selected={compliance.sqgsDetail[selected].id}
      />
      <SqgDetails sqg={sqg} summary={summary} />
      <SqgLogLevelViolations sqg={sqg} stats={stats} />
      <SqgRuleViolations sqg={sqg} stats={stats} />
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
  color: var(${ThemeColorVariables.foreground});
  background-color: var(${ThemeColorVariables.background});
  border-top: 1px solid var(${ThemeColorVariables.errorBorder});
`;
