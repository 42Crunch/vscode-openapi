import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { PlainSelect } from "../../components/Select";
import { Filter, changeFilter } from "./slice";

export default function FilterDomain() {
  const filter = useAppSelector((state) => state.audit.filter);
  const dispatch = useAppDispatch();

  const options = [
    { label: "All", value: "all" },
    { label: "Security", value: "security" },
    { label: "Data validation", value: "datavalidation" },
    { label: "OpenAPI format requirements", value: "oasconformance" },
  ];

  return (
    <Container>
      <PlainSelect
        label="Category"
        options={options}
        placeholder="All"
        onSelectedItemChange={(item) => {
          if (item && item.value !== "all") {
            dispatch(changeFilter({ ...filter, domain: item?.value as Filter["domain"] }));
          } else {
            dispatch(changeFilter({ ...filter, domain: undefined }));
          }
        }}
        selected={filter?.domain || "all"}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 264px;
`;
