import { OasSecurityScheme } from "@xliic/common/oas30";
import * as playbook from "@xliic/common/playbook";
import { SwaggerSecurityScheme } from "@xliic/common/swagger";
import styled from "styled-components";
import CredentialPicker from "./CredentialPicker";

export default function SecurityRequirement({
  requirement,
  credentials,
  values,
  setValues,
}: {
  requirement: Record<string, OasSecurityScheme | SwaggerSecurityScheme>;
  credentials: playbook.Credentials;
  values: Record<string, string>;
  setValues: (values: Record<string, string>) => void;
}) {
  return (
    <>
      {Object.keys(requirement)
        .sort()
        .map((schemeName) => {
          const scheme = requirement[schemeName];
          return (
            <Container key={schemeName}>
              <Label>Credential value for "{schemeName}"</Label>
              <CredentialPicker
                value={values[schemeName]}
                scheme={scheme}
                schemeName={schemeName}
                credentials={credentials}
                onChange={(value) => {
                  const updatedValues = { ...values };
                  if (value !== undefined) {
                    updatedValues[schemeName] = value;
                  } else {
                    updatedValues[schemeName] = "";
                  }
                  setValues(updatedValues);
                }}
              />
            </Container>
          );
        })}
    </>
  );
}

const Container = styled.div`
  display: contents;
`;

const Label = styled.div`
  display: flex;
  align-items: center;
`;
