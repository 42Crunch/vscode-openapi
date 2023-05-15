import styled from "styled-components";

import { useAppDispatch } from "./store";
import { Xmark } from "../../icons";

import { changeFilter } from "./slice";

export default function FilterResetAll() {
  const dispatch = useAppDispatch();

  return (
    <Container
      onClick={(e) => {
        dispatch(changeFilter({}));
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Xmark /> <span>Reset filters</span>
    </Container>
  );
}

const Container = styled.div`
  width: 264px;
  height: 50px;
  display: flex;
  align-items: center;
  cursor: pointer;
  > svg {
    width: 16px;
    height: 16px;
    margin-right: 4px;
  }
`;
