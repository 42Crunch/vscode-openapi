import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { PlainSelect } from "../../components/Select";
import { changeFilter } from "./slice";

export default function FilterPath() {
  const { filter, paths } = useAppSelector((state) => state.scan);
  const dispatch = useAppDispatch();

  const options = paths.map((path) => ({ label: path, value: path }));

  return (
    <Container>
      <PlainSelect
        label="Path"
        options={options}
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
