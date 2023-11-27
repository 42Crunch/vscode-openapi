import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import AddNewRow from "./AddNewRow";
import EnvKeyValue from "./EnvKeyValue";
import { TriangleExclamation } from "../../../../icons";
import { MissingVariable } from "./MissingVariable";

export default function Environment({
  name,
  names,
  variables,
  missing,
}: {
  name: string;
  names: string[];
  variables: string[];
  missing?: string[];
}) {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
        <div>Type</div>
        <div></div>
      </Header>
      {fields.map((field, index) => (
        <EnvKeyValue
          key={field.id}
          name={`${name}.${index}`}
          variables={variables}
          names={names}
          remove={() => {
            remove(index);
          }}
        />
      ))}
      <AddNewRow append={append} />
      {missing && missing?.length > 0 && (
        <Missing>
          <TriangleExclamation /> <span className="message">Unset variables</span>
          {missing.map((name) => (
            <MissingVariable key={name} name={name} append={append} />
          ))}
        </Missing>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr 7em 2em;
`;

const Header = styled.div`
  display: contents;
  > div {
    background-color: var(${ThemeColorVariables.computedOne});
    padding: 4px 8px;
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;

const Missing = styled.div`
  margin-top: 8px;
  padding: 8px;
  border: 1px solid var(${ThemeColorVariables.border});
  grid-column: span 3;
  display: flex;
  align-items: center;
  gap: 6px;
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
  }
  > span.message {
    color: var(${ThemeColorVariables.errorForeground});
  }
`;
