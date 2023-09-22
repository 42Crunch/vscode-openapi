import styled from "styled-components";
import { useFieldArray } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";

import CredentialEntry from "./CredentialEntry";
import CredentialAddNew from "./CredentialAddNew";

export default function CredentialCredentials() {
  const name = "methods";

  const { fields, append, remove } = useFieldArray({
    name,
  });

  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
      </Header>
      {fields.map((field, index) => (
        <div key={field.id}>
          <CredentialEntry
            name={`${name}.${index}`}
            remove={() => {
              remove(index);
            }}
          />
        </div>
      ))}
      <div>
        <CredentialAddNew append={append} />
      </div>
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
`;

const Header = styled.div`
  display: flex;
  div:first-child {
    flex: 1;
  }
  div:last-child {
    flex: 2;
  }
  & > div {
    padding: 4px 8px;
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;
