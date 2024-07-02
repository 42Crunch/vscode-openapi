import { ConfigScreen, saveConfig } from "../../../features/config/slice";
import { ThemeColorVariables } from "@xliic/common/theme";
import * as z from "zod";
import styled from "styled-components";
import { useFieldArray, useWatch } from "react-hook-form";

function HostnameDisplay({ name }: { name: string }): JSX.Element {
  const hostname = useWatch({ name });
  return <HostnameSpan>{hostname}</HostnameSpan>;
}

function OpenApiInsecureSslHostTableRow({ name }: { name: string }): JSX.Element {
  return (
    <Row>
      <CellContainer>
        <HostnameDisplay name={`${name}.name`} />
      </CellContainer>
    </Row>
  );
}

export function OpenApiInsecureSslHostnames() {
  const { fields } = useFieldArray({
    name: "insecureSslHostnames",
  });
  return (
    <Container>
      <p>List of hostnames TryIt is allowed to connect ignoring SSL certificate errors</p>
      <Grid>
        <Header>
          <div className="openapi-external-refs-host">Host</div>
        </Header>
        <Fields>
          {fields.map((field, index) => (
            <OpenApiInsecureSslHostTableRow key={field.id} name={`insecureSslHostnames.${index}`} />
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
  grid-template-columns: 1fr;
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

const schema = z.object({
    insecureSslHostnames: z.array(z.unknown()),
});

const screen: ConfigScreen = {
  id: "openapi-insecure-ssl-hostnames",
  label: "Insecure SSL Hostnames",
  schema,
  form: OpenApiInsecureSslHostnames,
};
export default screen;
