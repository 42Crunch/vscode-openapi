import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { AngleDown, TrashCan } from "../../../../icons";
import Select from "./Select";
import Input from "./Input";

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
          <div style={{ gridColumn: "span 2" }}>Name or Path</div>
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
        </Fields>
      </Grid>
      <Control>
        <AddNewVariable append={append} />
      </Control>
    </Container>
  );
}

const Container = styled.div`
  margin: 8px 4px;
`;

const Control = styled.div`
  margin: 4px;
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

  return (
    <Row>
      <Input name={`${name}.key`} label="name" />
      {type === "body" ? (
        <VariableAssignmentBody name={name} />
      ) : (
        <VariableAssignmentParameter name={name} />
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
  visibility: hidden;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Row = styled.div`
  display: contents;
  &:hover > :last-child {
    visibility: visible;
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

function VariableAssignmentParameter({ name }: { name: string }) {
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
          { value: "path", label: "path" },
        ]}
      />

      <Input name={`${name}.value.name`} label="name" style={{ gridColumn: "span 2" }} />
    </>
  );
}

function AddNewVariable({ append }: { append: any }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton>
          <span>New variable</span>
          <AngleDown />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={() => {
              append(
                {
                  key: "varname",
                  value: {
                    from: "request",
                    in: "body",
                    contentType: "json",
                    path: { type: "jsonPointer", value: "/" },
                  },
                },
                { shouldFocus: true }
              );
            }}
          >
            From Body
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              append(
                {
                  key: "varname",
                  value: {
                    from: "request",
                    in: "query",
                    name: "name",
                  },
                },
                { shouldFocus: true }
              );
            }}
          >
            From Parameters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const Name = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  margin-right: 10px;
`;

const IconButton = styled.button`
  padding: 3px 6px;
  background-color: var(${ThemeColorVariables.buttonBackground});
  color: var(${ThemeColorVariables.buttonForeground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  &:hover {
    background-color: var(${ThemeColorVariables.buttonHoverBackground});
  }
  > svg {
    margin-left: 4px;
    width: 12px;
    height: 12px;
    fill: var(${ThemeColorVariables.buttonForeground});
  }
`;

const DropdownMenuContent = styled(DropdownMenu.Content)`
  margin: 4px;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  border: 1px solid var(${ThemeColorVariables.dropdownBorder});
  min-width: 160px;
  padding: 4px;
`;

const DropdownMenuItem = styled(DropdownMenu.Item)`
  position: relative;
  margin: 2px;
  color: var(${ThemeColorVariables.dropdownForeground});
  &[data-highlighted] {
    background-color: var(${ThemeColorVariables.listActiveSelectionBackground});
    color: var(${ThemeColorVariables.listActiveSelectionForeground});
  }
`;
