import styled from "styled-components";
import * as playbook from "@xliic/common/playbook";
import type { OasSecurityScheme } from "@xliic/common/oas30";
import type { SwaggerSecurityScheme } from "@xliic/common/swagger";

import { CredentialNameField } from "./CredentialNameField";

export function SecurityCredentialSelector({
  selectedCredentialName,
  schema,
  placeholder,
  credentials,
  onChange,
}: {
  schema: OasSecurityScheme | SwaggerSecurityScheme;
  credentials: playbook.Credentials;
  selectedCredentialName: string;
  placeholder: string;
  onChange: (value: string | undefined) => void;
}) {
  const matching = Object.keys(credentials).filter((name) => {
    const credential = credentials[name];
    return (
      credential.type === schema.type &&
      credential.in === schema.in &&
      credential.name === schema.name
    );
  });

  return (
    <Container>
      <CredentialNameField
        value={selectedCredentialName}
        onChange={onChange}
        names={matching}
        placeholder={placeholder}
      />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
