import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { TrashCan } from "../../../../icons";
import Select from "./Select";
import Input from "./Input";
import DownshiftSelect from "../../../../new-components/DownshiftSelect";

export default function VariableAssignments({
  name,
  index: responseIndex,
}: {
  name: string;
  index: number;
}) {
  const { fields, append, remove } = useFieldArray({
    name: `responses.${responseIndex}.value.variableAssignments`,
  });

  return (
    <Container>
      <Grid>
        <Header>
          <div>Variable name</div>
          <div>From</div>
          <div>Location</div>
          <div>Type</div>
          <div>Name or Path</div>
          <div></div>
        </Header>
        <Fields>
          {fields.map((field, assignmentIndex) => (
            <VariableAssignment
              key={field.id}
              name={`responses.${responseIndex}.value.variableAssignments.${assignmentIndex}`}
              remove={() => {
                remove(assignmentIndex);
              }}
            />
          ))}
          <AddNewVariable append={append} />
        </Fields>
      </Grid>
    </Container>
  );
}

const Container = styled.div`
  margin: 8px 4px;
`;

const Grid = styled.div`
  margin: 4px;
  display: grid;
  row-gap: 4px;
  grid-template-columns: repeat(5, 1fr) 1em;
`;

const Fields = styled.div`
  display: contents;
  & > div > div {
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
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

function VariableAssignment({ name, remove }: { name: string; remove: () => void }) {
  const { getValues } = useFormContext();

  const type = getValues(`${name}.value.in`);
  const from = getValues(`${name}.value.from`);

  return (
    <Row>
      <Input name={`${name}.key`} label="name" />
      {type === "body" && <VariableAssignmentBody key={`${name}-value`} name={name} />}
      {type !== "body" && from === "request" && (
        <VariableAssignmentParameterRequest key={`${name}-value`} name={name} />
      )}
      {type !== "body" && from === "response" && (
        <VariableAssignmentParameterResponse key={`${name}-value`} name={name} />
      )}

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
  opacity: 0;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Row = styled.div`
  display: contents;
  &:hover > :last-child {
    opacity: 1;
  }
`;

function VariableAssignmentBody({ name }: { name: string }) {
  return (
    <>
      <Select
        name={`${name}.value.from`}
        options={[
          { value: "request", label: "request" },
          { value: "response", label: "response" },
        ]}
      />
      <Select name={`${name}.value.in`} options={[{ value: "body", label: "body" }]} />
      <Select
        name={`${name}.value.path.type`}
        options={[
          { value: "jsonPointer", label: "jsonPointer" },
          { value: "jsonPath", label: "jsonPath" },
        ]}
      />
      <Input name={`${name}.value.path.value`} label="path" />
    </>
  );
}

function VariableAssignmentParameterRequest({ name }: { name: string }) {
  return (
    <>
      <Select
        name={`${name}.value.from`}
        options={[
          { value: "request", label: "request" },
          { value: "response", label: "response" },
        ]}
      />
      <Select
        name={`${name}.value.in`}
        options={[
          { value: "query", label: "query" },
          { value: "header", label: "header" },
          { value: "cookie", label: "cookie" },
          { value: "path", label: "path" },
        ]}
      />
      <div />

      <Input name={`${name}.value.name`} label="name" />
    </>
  );
}

function VariableAssignmentParameterResponse({ name }: { name: string }) {
  return (
    <>
      <Select
        name={`${name}.value.from`}
        options={[
          { value: "request", label: "request" },
          { value: "response", label: "response" },
        ]}
      />
      <Select
        name={`${name}.value.in`}
        options={[
          { value: "header", label: "header" },
          { value: "cookie", label: "cookie" },
        ]}
      />
      <div />

      <Input name={`${name}.value.name`} label="name" />
    </>
  );
}

function AddNewVariable({ append }: { append: any }) {
  return (
    <div style={{ gridColumn: "span 2" }}>
      <div style={{ padding: "4px 8px" }}>
        <DownshiftSelect
          placeholder="Add new variable"
          options={[
            { value: "body", label: "Extract value from body" },
            { value: "params", label: "Extract value from query, header, cookie or path" },
          ]}
          onSelectedItemChange={(selection) => {
            if (selection?.value === "body") {
              append(
                {
                  key: "varname",
                  value: {
                    from: "response",
                    in: "body",
                    contentType: "json",
                    path: { type: "jsonPointer", value: "/" },
                  },
                },
                { shouldFocus: true }
              );
            } else if (selection?.value === "params") {
              append(
                {
                  key: "varname",
                  value: {
                    from: "response",
                    in: "header",
                    name: "name",
                  },
                },
                { shouldFocus: true }
              );
            }
          }}
        />
      </div>
    </div>
  );
}
