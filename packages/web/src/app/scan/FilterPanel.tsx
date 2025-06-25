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

export default function FilterPanel() {
  const { filter } = useAppSelector((state) => state.scan);
  const [collapsed, setCollapsed] = useState(false);
  const names = ["severity", "title"] as (keyof Filter)[];
  const count = names.filter((name) => filter && filter[name] !== undefined).length;

  return (
    <Container>
      {/* <Top>
        <FilterButton filters={count} onClick={() => setCollapsed(!collapsed)} />
      </Top> */}
      {!collapsed && (
        <Bottom>
          <FilterCriticality />
          <FilterTitle />
          <FilterPath />
          <FilterMethod />
          <FilterOperationId />
          {/* <FilterResetAll /> */}
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
