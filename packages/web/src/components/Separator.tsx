import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function Separator({
  title,
  icon,
  className,
}: {
  title: string;
  icon?: JSX.Element;
  className?: string;
}) {
  return (
    <Container className={className}>
      {icon}
      <div>{title}</div>
      <hr />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  gap: 8px;
  cursor: pointer;
  align-items: center;
  opacity: 0.8;
  font-size: 90%;

  & > svg {
    fill: var(${ThemeColorVariables.foreground});
  }

  & > hr {
    flex: 1;
    border: none;
    border-top: 1px solid var(${ThemeColorVariables.border});
  }
`;
