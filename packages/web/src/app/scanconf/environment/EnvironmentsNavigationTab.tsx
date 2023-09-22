import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import { makeEnvEnv } from "../../../core/playbook/execute";
import { TriangleExclamation } from "../../../icons";
import { useAppSelector } from "../store";

export default function EnvironmentsNavigationTab() {
  const {
    playbook: { environments, runtimeConfiguration },
  } = useAppSelector((state) => state.scanconf);

  const env = useAppSelector((state) => state.env.data);

  if (environments == undefined || runtimeConfiguration == undefined) {
    return <Container>Environment</Container>;
  }

  const { missing } = makeEnvEnv(environments[runtimeConfiguration?.environment || "default"], env);

  return (
    <Container>
      Environment
      {missing.length > 0 && <TriangleExclamation />}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
    padding-right: 4px;
  }
`;
