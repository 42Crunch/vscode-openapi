import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { PlainSelect } from "../../components/Select";
import { Filter, changeFilter } from "./slice";

const allOptions = {
  security: [
    { label: "All", value: "all" },
    { label: "Authentication", value: "authentication" },
    { label: "Authorization", value: "authorization" },
    { label: "Transport", value: "transport" },
  ],
  oasconformance: [
    { label: "All", value: "all" },
    { label: "Structure", value: "validation" },
    { label: "Semantic", value: "semantics" },
    { label: "Best practices", value: "bestpractices" },
  ],
  datavalidation: [
    { label: "All", value: "all" },
    { label: "Parameters", value: "parameters" },
    { label: "Paths", value: "paths" },
    { label: "Schema", value: "schema" },
    { label: "Response headers", value: "responseheader" },
    { label: "Response definition", value: "responsedefinition" },
  ],
};

export default function FilterGroup() {
  const filter = useAppSelector((state) => state.audit.filter);
  const dispatch = useAppDispatch();

  const options = filter.domain !== undefined ? allOptions[filter.domain] : [];

  return (
    <Container>
      <PlainSelect
        label="Group"
        options={options}
        placeholder="All"
        onSelectedItemChange={(item) => {
          if (item && item.value !== "all") {
            dispatch(changeFilter({ ...filter, group: item?.value as Filter["group"] }));
          } else {
            dispatch(changeFilter({ ...filter, group: undefined }));
          }
        }}
        selected={filter?.group || "all"}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 264px;
`;
