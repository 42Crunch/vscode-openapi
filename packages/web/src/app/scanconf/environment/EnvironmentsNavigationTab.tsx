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

  if (environments == undefined && runtimeConfiguration == undefined) {
    return <Container>Environment</Container>;
  }

  const environment = environments[runtimeConfiguration?.environment || "default"];

  const [scanenv, scanenvError] = makeEnvEnv(environment, env);

  return (
    <Container>
      Environment
      {scanenvError !== undefined && <TriangleExclamation />}
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
