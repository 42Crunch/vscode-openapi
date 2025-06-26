import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";
import { SeverityLevel } from "@xliic/common/audit";

import { PlainSelect } from "../../components/Select";
import { changeFilter } from "./slice";

export default function FilterCriticality() {
  const filter = useAppSelector((state) => state.scan.filter);
  const dispatch = useAppDispatch();

  const options: { label: string; value: number | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Critical", value: 5 },
    { label: "High", value: 4 },
    { label: "Medium", value: 3 },
    { label: "Low", value: 2 },
    { label: "Info", value: 1 },
  ];

  return (
    <Container>
      <PlainSelect
        label="Severity"
        options={options}
        placeholder="All"
        onSelectedItemChange={(item) => {
          if (item && item.value !== "all") {
            dispatch(changeFilter({ ...filter, criticality: item?.value as number }));
          } else {
            dispatch(changeFilter({ ...filter, criticality: undefined }));
          }
        }}
        selected={filter?.criticality || "all"}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 264px;
`;
