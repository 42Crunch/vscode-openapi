import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import AddNewRow from "./AddNewRow";
import EnvKeyValue from "./EnvKeyValue";

export default function Environment({
  name,
  names,
  variables,
}: {
  name: string;
  names: string[];
  variables: string[];
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
      <NewRow>
        <AddNewRow append={append} />
      </NewRow>
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

const NewRow = styled.div`
  grid-column: span 4;
`;
