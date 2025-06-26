import styled from "styled-components";

import FilterButton from "./FilterButton";
import { Filter } from "./slice";
import FilterResetAll from "./FilterResetAll";
import { useState } from "react";
import { useAppSelector } from "./store";
import FilterCriticality from "./FilterCriticality";
import FilterTitle from "./FilterTitle";
import FilterPath from "./FilterPath";
import FilterOperationId from "./FilterOperationId";
import FilterMethod from "./FilterMethod";

export default function FilterPanel({ total }: { total: number }) {
  const filter = useAppSelector((state) => state.scan.filter);
  const [collapsed, setCollapsed] = useState(true);
  return (
    <Container>
      <Top>
        <div>{total} issue(s)</div>
        <FilterButton
          filters={Object.entries(filter).filter(([_, value]) => value !== undefined).length}
          onClick={() => setCollapsed(!collapsed)}
        />
      </Top>
      {!collapsed && (
        <Bottom>
          <FilterCriticality />
          <FilterTitle />
          <FilterPath />
          <FilterMethod />
          <FilterOperationId />
          <FilterResetAll onClick={() => setCollapsed(true)} />
        </Bottom>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Top = styled.div`
  margin: 6px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  > div:first-child {
    font-weight: 700;
  }
`;

const Bottom = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  gap: 8px;
  > div {
    width: 264px;
  }
`;
