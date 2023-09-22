import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleUp, AngleDown } from "../../../icons";

export default function Separator({ title }: { title: string }) {
  return (
    <Container>
      <div>{title}</div>
      <hr />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  margin-left: 8px;
  margin-right: 8px;
  margin-top: 4px;
  margin-bottom: 4px;
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
