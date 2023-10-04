import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useFieldArray } from "react-hook-form";
import styled from "styled-components";
import Switch from "../../../components/Switch";
import { showEnvWindow } from "../../../features/env/slice";
import { AngleDown, ArrowUpRightFromSquare, TrashCan, TriangleExclamation } from "../../../icons";
import Input from "../components/operation/Input";
import { useAppDispatch } from "../store";

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
          <div>From</div>
          <div></div>
          <div>Environment</div>
          <div>Default</div>
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
      </Grid>
      <Control>
        {/* <AddNewVariable append={append} /> */}
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
  margin: 4px;
  display: grid;
  row-gap: 4px;
  grid-template-columns: 10em 7em 1.5em 1fr 1fr 5em 1em;
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
  return (
    <Row>
      <Input name={`${name}.key`} label="name" />
      <FromEnvironment>environment</FromEnvironment>
      <ErrorContainer>{missing && <TriangleExclamation />}</ErrorContainer>
      <Input name={`${name}.value.name`} label="name" />
      <Input name={`${name}.value.default`} label="default" />
      <SwitchContainer>
        <Switch value={true} onChange={() => undefined} />
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

const FromEnvironment = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

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
  // justify-content: center;
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

const Manage = styled.div`
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
