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
      </Header>
      {fields.map((field, index) => (
        <div key={field.id}>
          <EnvKeyValue
            name={`${name}.${index}`}
            remove={() => {
              remove(index);
            }}
          />
        </div>
      ))}
      <div>
        <AddNewRow append={append} />
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

interface Item {
  key: string;
  value: string;
}

function wrapEnvironment(environment: SimpleEnvironment): { values: Item[] } {
  const wrapped = Object.entries(environment).map(([key, value]) => ({ key, value }));
  return { values: wrapped };
}

function unwrapEnvironment(data: { values: Item[] }): SimpleEnvironment {
  const environment: SimpleEnvironment = {};
  for (const item of data.values) {
    environment[item.key] = item.value;
  }
  return environment;
}
