import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";
import { Criticality, CriticalityLevel, SeverityLevel } from "@xliic/common/audit";

import { PlainSelect } from "../../components/Select";
import { changeFilter } from "./slice";

export default function FilterSeverity() {
  const filter = useAppSelector((state) => state.audit.filter);
  const dispatch = useAppDispatch();

  const options: { label: string; value: SeverityLevel | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
    { label: "Info", value: "info" },
  ];

  return (
    <Container>
      <PlainSelect
        label="Severity"
        options={options}
        placeholder="All"
        onSelectedItemChange={(item) => {
          if (item && item.value !== "all") {
            dispatch(changeFilter({ ...filter, severity: item?.value as SeverityLevel }));
          } else {
            dispatch(changeFilter({ ...filter, severity: undefined }));
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
