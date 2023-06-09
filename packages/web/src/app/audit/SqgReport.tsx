import styled from "styled-components";
import { useState } from "react";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useAppDispatch, useAppSelector } from "./store";
import { setSqgTodo } from "./slice";

import Switch from "../../components/Switch";
import CollapsibleCaret from "../../components/CollapsibleCaret";
import { ExclamationCircle } from "../../icons";
import Compliance from "./SqgCompliance";
import { Banner } from "../../components/Banner";

export default function FilterPanel() {
  const { compliance, summary } = useAppSelector((state) => state.audit.audit);
  const stats = useAppSelector((state) => state.audit.stats);
  const todo = useAppSelector((state) => state.audit.sqgTodo);

  const dispatch = useAppDispatch();

  const setTodo = (value: boolean) => {
    dispatch(setSqgTodo(value));
  };

  const [expanded, setExpanded] = useState(false);

  if (compliance === undefined) {
    return null;
  }

  if (compliance.acceptance === "yes") {
    return (
      <ContainerOk>
        <Banner message="Security quality gates passed" />
      </ContainerOk>
    );
  }

  return (
    <Container>
      <Top>
        <ExclamationCircle />
        <div>Security quality gates failed</div>
        <Switch value={todo} onChange={setTodo} />
        Show only SQG to-do list
        <CollapsibleCaret
          isOpen={expanded}
          onClick={() => setExpanded(!expanded)}
          style={{ width: 14, height: 14 }}
        />
      </Top>
      {expanded && <Compliance compliance={compliance} summary={summary} stats={stats} />}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  border-radius: 2px;
  border: 1px solid var(${ThemeColorVariables.errorBorder});
  background-color: var(${ThemeColorVariables.errorBackground});
  color: var(${ThemeColorVariables.errorForeground});
`;

const Top = styled.div`
  display: flex;
  padding: 8px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
  }
  > div:nth-child(2) {
    flex: 1;
  }
`;

const ContainerOk = styled.div`
  margin: 8px;
`;
