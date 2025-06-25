import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { PlainSelect } from "../../components/Select";
import { changeFilter } from "./slice";

export default function FilterPath() {
  const paths = useAppSelector((state) => state.scan.scanReport?.paths || []);
  const filter = useAppSelector((state) => state.scan.filter);
  const dispatch = useAppDispatch();

  return (
    <Container>
      <PlainSelect
        label="Path"
        options={paths}
        placeholder="All"
        onSelectedItemChange={(item) => {
          if (item && item.value !== "all") {
            dispatch(
              changeFilter({ ...filter, path: item.value as string, operationId: undefined })
            );
          } else {
            dispatch(changeFilter({ ...filter, path: undefined, operationId: undefined }));
          }
        }}
        selected={filter.path || "all"}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 264px;
`;
