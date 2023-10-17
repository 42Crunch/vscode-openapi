import { ResolvedOasOperationSecurity } from "@xliic/common/oas30";
import { ResolvedSwaggerOperationSecurity } from "@xliic/common/swagger";
import Select from "../../../../new-components/Select";
import DownshiftSelect from "../../../../new-components/DownshiftSelect";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function SecurityRequirementsSelect({
  security,
  value,
  setValue,
}: {
  security: ResolvedOasOperationSecurity | ResolvedSwaggerOperationSecurity;
  value: number;
  setValue: (value: number) => void;
}) {
  const requirements = security.map((requirement, index) => ({
    value: index,
    label: Object.keys(requirement).sort().join(", "),
  }));

  return (
    <Container>
      <DownshiftSelect
        options={requirements}
        selected={value}
        onSelectedItemChange={(item) => item && setValue(item.value as number)}
      />
    </Container>
  );

  // return (
  //   <Select
  //     selected={value}
  //     options={requirements}
  //     onSelectedItemChange={}
  //   />
  // );
}

const Container = styled.div`
  border-bottom: 1px solid var(${ThemeColorVariables.border});
`;
