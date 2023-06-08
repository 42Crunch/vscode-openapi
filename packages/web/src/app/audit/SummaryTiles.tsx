import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useAppDispatch, useAppSelector } from "./store";
import { changeFilter, changeTab } from "./slice";

export function SummaryTiles() {
  const summary = useAppSelector((state) => state.audit.audit.summary);
  const dispatch = useAppDispatch();

  return (
    <Container>
      <Tiles>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("issues"));
            dispatch(changeFilter({}));
          }}
        >
          <div>Global score</div>
          <div>{summary.all}/100</div>
          <div></div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("issues"));
            dispatch(changeFilter({ domain: "security" }));
          }}
        >
          <div>Security score</div>
          <div>
            {summary.security.value}/{summary.security.max}
          </div>
          <div></div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(changeTab("issues"));
            dispatch(changeFilter({ domain: "datavalidation" }));
          }}
        >
          <div>Data validation score</div>
          <div>
            {summary.datavalidation.value}/{summary.datavalidation.max}
          </div>
          <div></div>
        </div>
      </Tiles>
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
`;

const Tiles = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
  & > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    border: 1px solid var(${ThemeColorVariables.border});
    border-radius: 2px;
    cursor: pointer;
    &:hover {
      background-color: var(${ThemeColorVariables.computedOne});
    }
    & > div:nth-child(1) {
      font-weight: 700;
      font-size: 12px;
    }
    & > div:nth-child(2) {
      font-size: 16px;
      font-weight: 700;
    }
    & > div:nth-child(3) {
      font-size: 12px;
    }
  }
`;
