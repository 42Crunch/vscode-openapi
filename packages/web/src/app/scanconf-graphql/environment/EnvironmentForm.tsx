import { ThemeColorVariables } from "@xliic/common/theme";
import { useFieldArray, useWatch } from "react-hook-form";
import styled from "styled-components";
import { showEnvWindow } from "../../../features/env/slice";
import { ArrowUpRightFromSquare, TrashCan, TriangleExclamation } from "../../../icons";
import Switch from "../../../new-components/fields/Switch";
import Input from "../components/operation/Input";
import { useAppDispatch } from "../store";
import AddNewRow from "./AddNewRow";

export default function EnvironmentForm({ missing }: { missing?: string[] }) {
  const dispatch = useAppDispatch();

  const { fields, append, remove } = useFieldArray({
    name: "variables",
  });

  return (
    <Container>
      <Grid>
        <Header>
          <div>Name</div>
          <div></div>
          <div>Source environment variable</div>
          <div>Default value</div>
          <div>Required</div>
          <div></div>
        </Header>
        <Fields>
          {fields.map((field, index) => {
            const envMissing = missing !== undefined && missing.includes((field as any).value.name);
            return (
              <EnvironmentVariable
                missing={envMissing}
                key={field.id}
                name={`variables.${index}`}
                remove={() => {
                  remove(index);
                }}
              />
            );
          })}
        </Fields>
        <AddNewRow append={append} />
      </Grid>
      <Control>
        <Manage
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            dispatch(showEnvWindow());
          }}
        >
          Manage IDE Environment <ArrowUpRightFromSquare />
        </Manage>
      </Control>
    </Container>
  );
}

const Container = styled.div``;

const Control = styled.div`
  padding-top: 8px;
  margin: 4px;
  display: flex;
  gap: 4px;
  align-items: center;
`;

const Grid = styled.div`
  margin: 8px;
  display: grid;
  row-gap: 4px;
  grid-template-columns: 10em 1.5em 1fr 1fr 5em 1em;
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

function EnvironmentVariable({
  name,
  remove,
  missing,
}: {
  name: string;
  missing: boolean;
  remove: () => void;
}) {
  const isRequired = useWatch({ name: `${name}.value.required` });

  return (
    <Row>
      <Input name={`${name}.key`} label="name" />
      <ErrorContainer>{missing && <TriangleExclamation />}</ErrorContainer>
      <Input name={`${name}.value.name`} label="name" />
      {!isRequired ? (
        <Input name={`${name}.value.default`} label="default" disabled={isRequired} />
      ) : (
        <div />
      )}

      <SwitchContainer>
        <Switch name={`${name}.value.required`} />
      </SwitchContainer>
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

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
    padding-right: 4px;
  }
`;

const SwitchContainer = styled.div`
  display: flex;
`;

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

const Manage = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
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
