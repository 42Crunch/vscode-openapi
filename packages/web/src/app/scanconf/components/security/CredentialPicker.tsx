import { OasSecurityScheme } from "@xliic/common/oas30";
import * as playbook from "@xliic/common/playbook";
import { SwaggerSecurityScheme } from "@xliic/common/swagger";
import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import { goTo } from "../../../../features/router/slice";
import { ArrowUpRightFromSquare } from "../../../../icons";
import DownshiftSelect from "../../../../new-components/DownshiftSelect";
import { useAppDispatch } from "../../store";

export default function CredentialPicker({
  scheme,
  schemeName,
  credentials,
  value,
  onChange,
}: {
  schemeName: string;
  scheme: OasSecurityScheme | SwaggerSecurityScheme;
  credentials: playbook.Credentials;
  value: string;
  onChange: (value: string | undefined) => void;
}) {
  const dispatch = useAppDispatch();

  const credentialsForScheme = flattenCredentials(credentials).filter(({ credential }) =>
    checkCredential(credential, scheme)
  );

  const options = credentialsForScheme.map(({ name }) => ({ label: name, value: name }));

  return (
    <Container>
      <DownshiftSelect
        placeholder={schemeName}
        options={options}
        selected={value}
        onSelectedItemChange={(item) => item && onChange(item.value as string)}
        bottomMenu={
          <Manage
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              dispatch(goTo(["auth"]));
            }}
          >
            Manage authentication <ArrowUpRightFromSquare />
          </Manage>
        }
      />
    </Container>
  );
}

const Container = styled.div`
  border-bottom: 1px solid var(${ThemeColorVariables.border});
`;

const Manage = styled.li`
  color: var(${ThemeColorVariables.linkForeground});
  &:hover {
    color: var(${ThemeColorVariables.linkActiveForeground});
  }
  cursor: pointer;
  & > svg {
    width: 10px;
    height: 10px;
  }
`;

function flattenCredentials(credentials: playbook.Credentials) {
  return Object.entries(credentials)
    .map(([credentialName, credential]) => {
      return Object.entries(credential.methods || {}).map(([methodName, method]) => {
        const name =
          credential.default === methodName ? credentialName : `${credentialName}/${methodName}`;
        return { name, credential };
      });
    })
    .flat();
}

function checkCredential(
  credential: playbook.Credential,
  scheme: OasSecurityScheme | SwaggerSecurityScheme
): boolean {
  if (scheme.type === credential.type && scheme.in === credential.in) {
    return true;
  } else if (scheme.type === "http" && credential.type == "basic" && scheme.in === credential.in) {
    return true;
  } else if (scheme.type === "basic" && credential.type == "basic" && scheme.in === credential.in) {
    return true;
  }

  return false;
}
