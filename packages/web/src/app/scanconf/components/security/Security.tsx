import styled from "styled-components";
import { useController } from "react-hook-form";
import { useState } from "react";

import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";
import { OpenApi30, Swagger } from "@xliic/openapi";

import SecurityRequirement from "./SecurityRequirement";
import SecurityRequirementsSelect from "./SecurityRequirementSelect";
import { checkCredential } from "../../../../core/playbook/util";

export default function Security({
  oas,
  security,
  credentials,
}: {
  oas: OpenApi30.BundledSpec | Swagger.BundledSpec;
  security: OpenApi30.ResolvedOperationSecurity | Swagger.ResolvedOperationSecurity;
  credentials: Playbook.Credentials;
}) {
  const { field: authField } = useController({
    name: "auth",
  });

  // security is a list of security requirement objects, each of which
  // contains one or more security schemes
  // here, given list of credentials supplied through "auth"
  // we calculate a match to see which schemes in each security requirement object
  // can be satisfied by the "auth" credentials
  // result contains "relevance" metric wich is higher for fully matching
  // security requirments and lower for partially matched ones
  // along with the names of credentials
  const matches = mapRequirementsToCredentials(security, credentials, authField.value);

  // pick most relevant match as a current selection for SecurityRequirementsSelect select
  const mostRelevantMatch = matches.reduce((prev, current) =>
    prev.relevance > current.relevance ? prev : current
  );

  const [selectedRequirementIndex, setSelectedRequirementIndex] = useState(
    mostRelevantMatch.requirementIndex
  );

  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
      </Header>
      <Fields>
        <SecurityRequirementsSelect
          security={security}
          value={selectedRequirementIndex}
          setValue={(requirementIndex) => {
            // new security requirement has been selected
            // setting auth to reflect displayed values
            setSelectedRequirementIndex(requirementIndex);
            authField.onChange(Object.values(matches[requirementIndex].matches));
          }}
        />
        <SecurityRequirement
          requirement={security[selectedRequirementIndex]}
          credentials={credentials}
          values={matches[selectedRequirementIndex].matches}
          setValues={(values) => {
            // changing values for a currently selected security requirement
            const newAuth = Object.values(values);
            authField.onChange(newAuth);
          }}
        />
      </Fields>
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  display: grid;
  grid-template-columns: 1fr 2fr;
`;

const Header = styled.div`
  display: contents;
  & > div {
    padding: 4px 8px;
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;

const Fields = styled.div`
  display: contents;
  & > div > div {
    padding: 4px 8px;
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
`;

function mapRequirementsToCredentials(
  security: OpenApi30.ResolvedOperationSecurity | Swagger.ResolvedOperationSecurity,
  credentials: Playbook.Credentials,
  auth: string[]
) {
  const authWithCredentials = mapAuthToCredentials(credentials, auth);
  return security.map((requirement, index) => {
    const matches = matchRequirementToAuth(requirement, authWithCredentials);
    const requirementSchemesCount = Object.keys(requirement).length;
    const authMatchesCount = Object.keys(matches).length;
    return {
      requirementIndex: index,
      matches,
      relevance: authMatchesCount / requirementSchemesCount,
    };
  });
}

function mapAuthToCredentials(
  credentials: Playbook.Credentials,
  auth: string[]
): Record<string, Playbook.Credential> {
  const result: Record<string, Playbook.Credential> = {};
  for (const credentialName of auth) {
    const credential = getCredentialByName(credentials, credentialName);
    if (credential !== undefined) {
      result[credentialName] = credential;
    }
  }
  return result;
}

function getCredentialByName(
  credentials: Playbook.Credentials,
  name: string
): Playbook.Credential | undefined {
  for (const [credentialName, credential] of Object.entries(credentials)) {
    if (credentialName === name) {
      return credential;
    } else {
      for (const [methodName, method] of Object.entries(credential.methods)) {
        if (`${credentialName}/${methodName}` === name) {
          return credential;
        }
      }
    }
  }
}

function matchRequirementToAuth(
  requirement: Record<string, OpenApi30.SecurityScheme | Swagger.SecurityScheme>,
  auth: Record<string, Playbook.Credential>
) {
  const mutable = { ...auth };
  const result: Record<string, string> = {};
  for (const [schemeName, scheme] of Object.entries(requirement)) {
    for (const [credentialName, credential] of Object.entries(mutable)) {
      if (checkCredential(credential, scheme)) {
        result[schemeName] = credentialName;
        delete mutable[credentialName];
        break;
      }
    }
  }
  return result;
}
