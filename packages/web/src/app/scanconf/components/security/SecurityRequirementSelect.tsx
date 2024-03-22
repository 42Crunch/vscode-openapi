import styled from "styled-components";

import { OpenApi30, Swagger } from "@xliic/openapi";

import DownshiftSelect from "../../../../new-components/DownshiftSelect";

export default function SecurityRequirementsSelect({
  security,
  value,
  setValue,
}: {
  security: OpenApi30.ResolvedOperationSecurity | Swagger.ResolvedOperationSecurity;
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
