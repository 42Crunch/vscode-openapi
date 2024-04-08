import styled from "styled-components";
import { useFormContext, useController } from "react-hook-form";
import { HttpMethod } from "@xliic/openapi";
import { ThemeColorVariables } from "@xliic/common/theme";
import { ProgressButton } from "../../new-components/ProgressButton";

export default function OperationHeader({
  method,
  path,
  servers,
  onSubmit,
  buttonText,
  submitDisabled,
  waiting,
}: {
  method: HttpMethod;
  path: string;
  servers: string[];
  onSubmit: any;
  buttonText: string;
  submitDisabled: boolean;
  waiting: boolean;
}) {
  const { control } = useFormContext();

  const {
    field: { onChange, value, ref },
    fieldState: { error },
  } = useController({
    name: "server",
    control,
  });

  return (
    <Container>
      <Operation>
        <Method>{method}</Method>
        <Path>
          <select
            onChange={onChange}
            value={value}
            ref={ref}
            style={{ width: "100%", textOverflow: "ellipsis" }}
          >
            {servers.map((server, index) => (
              <option key={`${server}-${index}`} value={server}>{`${server}${path}`}</option>
            ))}
          </select>
        </Path>
        <ProgressButton
          onClick={onSubmit}
          disabled={submitDisabled}
          waiting={waiting}
          label={buttonText}
        />
      </Operation>
    </Container>
  );
}

const Method = styled.div`
  text-transform: uppercase;
  padding-left: 1rem;
  padding-right: 1rem;
  display: flex;
  align-items: center;
  border-right: 1px solid var(${ThemeColorVariables.border});
`;

const Path = styled.div`
  line-break: anywhere;
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
  & > select {
    flex: 1;
    border: none;
    background-color: transparent;
    color: var(${ThemeColorVariables.foreground});
    margin-right: 4px;
  }
`;

const Operation = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  display: flex;
  flex: 1;
  height: 2.1rem;
  > button {
    width: 80px;
  }
`;

const Container = styled.div`
  padding: 8px;
`;
