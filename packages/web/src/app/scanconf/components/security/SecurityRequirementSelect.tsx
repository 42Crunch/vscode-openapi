import { ResolvedOasOperationSecurity } from "@xliic/common/oas30";
import { ResolvedSwaggerOperationSecurity } from "@xliic/common/swagger";
import DownshiftSelect from "../../../../new-components/DownshiftSelect";
import styled from "styled-components";

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
      <Label>Security scheme(s)</Label>
      <div>
        <DownshiftSelect
          options={requirements}
          selected={value}
          onSelectedItemChange={(item) => item && setValue(item.value as number)}
        />
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: contents;
`;

const Label = styled.div`
  display: flex;
  align-items: center;
`;
