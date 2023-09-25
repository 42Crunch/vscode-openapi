import styled from "styled-components";
import { useFieldArray, useFormContext } from "react-hook-form";
import { SimpleEnvironment } from "@xliic/common/env";
import { ThemeColorVariables } from "@xliic/common/theme";

import EnvKeyValue from "./EnvKeyValue";
import AddNewRow from "./AddNewRow";

export default function Environment({ name }: { name: string }) {
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

interface Item {
  key: string;
  value: string;
}
