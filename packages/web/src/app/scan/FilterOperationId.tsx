import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { PlainSelect } from "../../components/Select";
import { changeFilter } from "./slice";

export default function FilterOperationId() {
  const operationIds = useAppSelector((state) => state.scan.scanReport?.operationIds || []);
  const filter = useAppSelector((state) => state.scan.filter);
  const dispatch = useAppDispatch();

  return (
    <Container>
      <PlainSelect
        label="Operation ID"
        options={operationIds}
        placeholder="All"
        onSelectedItemChange={(item) => {
          if (item && item.value !== "all") {
            dispatch(changeFilter({ ...filter, operationId: item.value as string }));
          } else {
            dispatch(changeFilter({ ...filter, operationId: undefined }));
          }
        }}
        selected={filter.operationId || "all"}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 264px;
`;
