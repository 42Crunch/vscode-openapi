import styled from "styled-components";

import FilterButton from "./FilterButton";
import FilterSeverity from "./FilterSeverity";
import { Filter, changeFilter } from "./slice";
import FilterResetAll from "./FilterResetAll";
import { useState } from "react";
import FilterRule from "./FilterRule";
import FilterDomain from "./FilterDomain";
import { useAppDispatch, useAppSelector } from "./store";
import FilterGroup from "./FilterGroup";
import { Xmark } from "../../icons";

export default function FilterPanel() {
  const { filtered, filter } = useAppSelector((state) => state.audit);
  const dispatch = useAppDispatch();
  const [collapsed, setCollapsed] = useState(true);
  const names = ["rule", "domain", "group", "severity"] as (keyof Filter)[];
  const count = names.filter((name) => filter && filter[name] !== undefined).length;

  return (
    <Container>
      {filter.ids !== undefined && (
        <Top>
          <div>{filtered.length} issues</div>
          <Reset
            onClick={(e) => {
              dispatch(changeFilter({}));
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Xmark /> <span>Reset filters</span>
          </Reset>
        </Top>
      )}
      {filter.ids === undefined && (
        <Top>
          <div>{filtered.length} issues</div>
          <FilterButton filters={count} onClick={() => setCollapsed(!collapsed)} />
        </Top>
      )}
      {!collapsed && (
        <Bottom>
          <FilterDomain />
          <FilterGroup />
          <FilterSeverity />
          <FilterRule />
          <FilterResetAll />
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

const Reset = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  > svg {
    width: 16px;
    height: 16px;
    margin-right: 4px;
  }
`;
