import { ConfigScreen, saveConfig } from "../../../features/config/slice";
import { ApprovedHostConfiguration } from "@xliic/common/config";
import { useState } from "react";
import { ThemeColorVariables } from "@xliic/common/theme";
import * as z from "zod";
import styled from "styled-components";
import { Eye } from "../../../icons";
import { useController, useFieldArray, useWatch } from "react-hook-form";

const columnPlaceholders: ApprovedHostConfiguration = {
  host: "",
  header: "Authorization",
  prefix: "Bearer",
  token: "Token",
};

function FormInput(props: { name: string; [key: string]: any }): JSX.Element {
  const { name, children, ...additionalProps } = props;
  const { field } = useController({ name });

  return (
    <FormStyledInput {...additionalProps} {...field}>
      {children}
    </FormStyledInput>
  );
}

function HostnameDisplay({ name }: { name: string }): JSX.Element {
  const hostname = useWatch({ name });
  return <HostnameSpan>{hostname}</HostnameSpan>;
}

function OpenApiExternalRefsHostTableRow({ name }: { name: string }): JSX.Element {
  const [showToken, setShowToken] = useState(false);

  return (
    <Row>
      <CellContainer>
        <HostnameDisplay name={`${name}.host`} />
      </CellContainer>
      <CellContainer>
        <FormInput type="text" name={`${name}.header`} placeholder={columnPlaceholders.header} />
      </CellContainer>
      <CellContainer>
        <FormInput type="text" name={`${name}.prefix`} placeholder={columnPlaceholders.prefix} />
      </CellContainer>
      <TokenCellContainer>
        <FormInput
          type={showToken ? "text" : "password"}
          name={`${name}.token`}
          placeholder={columnPlaceholders.token}
        />
        <RevealTokenInput
          type="button"
          title={`${showToken ? "Hide" : "Reveal"} token`}
          onClick={() => setShowToken(!showToken)}
        >
          <Eye />
        </RevealTokenInput>
      </TokenCellContainer>
    </Row>
  );
}

export function OpenApiExternalRefs() {
  const { fields } = useFieldArray({
    name: "approvedHosts",
  });

  return (
    <Container>
      <p>Configure authentication for the hosts approved for external reference resolution</p>
      <Grid>
        <Header>
          <div className="openapi-external-refs-host">Host</div>
          <div className="openapi-external-refs-header">Header</div>
          <div className="openapi-external-refs-prefix">Prefix</div>
          <div className="openapi-external-refs-token">Token</div>
        </Header>
        <Fields>
          {fields.map((field, index) => (
            <OpenApiExternalRefsHostTableRow key={field.id} name={`approvedHosts.${index}`} />
          ))}
        </Fields>
      </Grid>
    </Container>
  );
}

const Container = styled.div``;
const Grid = styled.div`
  display: grid;
  row-gap: 4px;
  grid-template-columns: 1fr 0.375fr 0.375fr 0.75fr;
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
const Fields = styled.div`
  display: contents;
  & > div > div {
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
`;
const Row = styled.div`
  display: contents;
`;
const CellContainer = styled.div`
  padding: 4px 8px;
`;

const HostnameSpan = styled.span`
  line-height: 40px;
`;

const FormStyledInput = styled.input`
  height: 40px;
  background: transparent;
  line-height: 20px;
  border: none;
  padding: 0;
  color: var(${ThemeColorVariables.foreground});
  &::placeholder {
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
  &:focus {
    outline: none;
  }
`;

const TokenCellContainer = styled.div`
  padding: 4px 8px;
  display: flex;
  > input {
    flex: 1;
    margin-right: 4px;
  }
`;

const RevealTokenInput = styled.button`
  cursor: pointer;
  background: transparent;
  color: var(${ThemeColorVariables.foreground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  padding: 6px 0px;
  border-radius: 2px;
  width: 20px;
  &:focus {
    outline: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  > svg {
    height: 14px;
    width: 14px;
    min-width: 14px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const schema = z.object({
  approvedHosts: z.array(z.unknown()),
});

const screen: ConfigScreen = {
  id: "openapi-external-refs",
  label: "External References",
  schema,
  form: OpenApiExternalRefs,
};
export default screen;
