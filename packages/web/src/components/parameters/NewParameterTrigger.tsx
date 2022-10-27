import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Parameter } from "./Field";
import { useFormContext } from "react-hook-form";
import { escapeFieldName } from "../../util";

export function NewParameterTrigger({
  parameters,
  onSelection,
}: {
  parameters: Parameter[];
  onSelection: (parameter: Parameter) => void;
}) {
  const { getValues } = useFormContext();

  const available = parameters.filter((parameter: Parameter) => {
    const name = parameterToName(parameter);
    return ("type" in parameter && parameter.type === "array") || getValues(name) === undefined;
  });

  return (
    <Container>
      <Select>
        <select
          disabled={available.length === 0}
          value="-1"
          onChange={(e) => {
            const index = parseInt(e.target.value, 10);
            if (index !== -1) {
              onSelection(available[index]);
            }
          }}
        >
          <option value="-1" disabled={true}>
            add new
          </option>
          {available.map((parameter, index) => (
            <option key={index} value={index}>
              {parameter.name}
            </option>
          ))}
        </select>
      </Select>
      <Placeholder />
    </Container>
  );
}

function parameterToName(parameter: Parameter) {
  return `parameters.${parameter.in}.${escapeFieldName(parameter.name)}`;
}

const Container = styled.div`
  display: flex;
`;

const Select = styled.div`
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  flex: 1;
  margin-right: 10px;
  position: relative;
  &::before {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    content: "";
    pointer-events: none;

    mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'><path d='M192 384c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L192 306.8l137.4-137.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-160 160C208.4 380.9 200.2 384 192 384z'/></svg>");
    mask-repeat: no-repeat;
    mask-position: right;
    background-color: var(${ThemeColorVariables.disabledForeground});
  }
  > select {
    appearance: none;
    width: 100%;
    background: transparent;
    border: none;
    color: var(${ThemeColorVariables.disabledForeground});
  }
`;

const Placeholder = styled.div`
  flex: 2;
  border: none;
  background: transparent;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  margin-right: 1.5em;
`;
