import { ThemeColorVariables } from "@xliic/common/theme";
import { useFieldArray } from "react-hook-form";
import styled from "styled-components";
import { TrashCan } from "../../../../icons";
import Input from "../../../../new-components/fields/Input";
import LineEditor from "../../../../new-components/fields/LineEditor";

export default function ExternalParameters({
  name,
  variables,
}: {
  name: string;
  variables: string[];
}) {
  const { fields, append, remove } = useFieldArray({
    name: name,
  });

  return (
    <Container>
      <Grid>
        <Header>
          <div>Name</div>
          <div>Value</div>
          <div></div>
        </Header>
        <Fields>
          {fields.map((field, index) => (
            <Entry
              key={field.id}
              name={`${name}.${index}`}
              variables={variables}
              remove={() => {
                remove(index);
              }}
            />
          ))}
        </Fields>
        <AddNewEntry append={append} />
      </Grid>
    </Container>
  );
}

export function AddNewEntry({ append }: { append: any }) {
  return (
    <Name
      placeholder="name"
      value=""
      onChange={(e) => {
        append({ key: e.target.value, value: "" }, { shouldFocus: true });
      }}
    />
  );
}

const Name = styled.input`
  grid-column: span 3;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  margin-right: 10px;
  padding: 4px 8px;
`;

const Container = styled.div`
  margin: 8px 4px;
`;

const Grid = styled.div`
  margin: 4px;
  display: grid;
  row-gap: 4px;
  grid-template-columns: 1fr 2fr 1em;
`;

const Fields = styled.div`
  display: contents;
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

function Entry({
  name,
  variables,
  remove,
}: {
  name: string;
  variables: string[];
  remove: () => void;
}) {
  return (
    <Row>
      <Input name={`${name}.key`} />
      <LineEditor name={`${name}.value`} variables={variables} />
      <Remove
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          remove();
        }}
      >
        <TrashCan />
      </Remove>
    </Row>
  );
}

const Remove = styled.button`
  background: none;
  border: none;
  padding: 0;
  width: 1.5em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: hidden;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Row = styled.div`
  display: contents;
  > input,
  > div {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(${ThemeColorVariables.border});
    color: var(${ThemeColorVariables.foreground});
    padding: 4px 8px;
  }
  &:hover > :last-child {
    visibility: visible;
  }
`;
