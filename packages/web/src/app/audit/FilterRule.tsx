import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { PlainSelect } from "../../components/Select";
import { changeFilter } from "./slice";

export default function FilterSeverity() {
  const { issueTitles, filter } = useAppSelector((state) => state.audit);
  const dispatch = useAppDispatch();

  return (
    <Container>
      <PlainSelect
        label="Rules"
        options={[{ label: "All", value: "all" }, ...issueTitles]}
        placeholder="All"
        onSelectedItemChange={(item) => {
          if (item && item.value !== "all") {
            dispatch(changeFilter({ ...filter, rule: item?.value as string }));
          } else {
            dispatch(changeFilter({ ...filter, rule: undefined }));
          }
        }}
        selected={filter?.severity || "all"}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 264px;
`;
