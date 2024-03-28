import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { PlainSelect } from "../../components/Select";
import { changeFilter } from "./slice";

export default function FilterOperationId() {
  const { filter, operationIds } = useAppSelector((state) => state.scan);
  const dispatch = useAppDispatch();

  const options = operationIds.map((operationId) => ({ label: operationId, value: operationId }));

  return (
    <Container>
      <PlainSelect
        label="Operation ID"
        options={options}
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
