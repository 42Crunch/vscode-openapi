import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

export default function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  const percents = Math.ceil(progress * 100);
  const actualLabel = label !== undefined ? label : `${percents}%`;
  return (
    <ProgressBarContainer>
      <ProgressBarBack>{actualLabel}</ProgressBarBack>
      <ProgressBarFront progress={progress}>{actualLabel}</ProgressBarFront>
    </ProgressBarContainer>
  );
}

const ProgressBarContainer = styled.div`
  position: relative;
  display: flex;
  height: 26px;
  background-color: var(${ThemeColorVariables.computedTwo});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  border-radius: 6px;
  overflow: hidden;
`;

const ProgressBarBack = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: var(${ThemeColorVariables.computedOne});
  color: var(${ThemeColorVariables.foreground});
  border-radius: 6px;
`;

const ProgressBarFront = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(${ThemeColorVariables.buttonForeground});
  background-color: var(${ThemeColorVariables.buttonBackground});
  clip-path: inset(0 ${({ progress }: { progress: number }) => 100 - progress * 100}% 0 0);
  transition: clip-path 0.3s linear;
`;
