import * as z from "zod";
import {
  ConfigScreen,
} from "../../../features/config/slice";
import { Container, Title } from "../layout";
import { RadioGroup } from "../../../components/RadioGroup";
import { Checkbox } from "../../../components/Checkbox";
import styled from "styled-components";

export function MiscSettings() {
  return (
    <>
      <Title>Default Preview Renderer</Title>
      <p>
        Choose a default renderer to preview OpenAPI files
      </p>
      <ContainerWithBottom>
        <RadioGroup
            name="defaultPreviewRenderer"
            options={[
                { value: "swaggerui", label: "Use Swagger UI as a default renderer to preview OpenAPI files" },
                { value: "redoc", label: "Use ReDoc as a default renderer to preview OpenAPI files" },
            ]}
            direction="column"
            />
      </ContainerWithBottom>

      <Title>Sort OpenAPI Content</Title>
      <p>
        Choose a default way to sort OpenAPI files
      </p>
      <Container>
        <Checkbox
          name="sortOutlines"
          label='Alphabetically sort contents of OpenAPI explorer outlines'
        />
      </Container>
    </>
  );
}

const ContainerWithBottom = styled(Container)`
  padding-bottom: 16px
`;

const schema = z.object({
    defaultPreviewRenderer: z.enum(["swaggerui", "redoc"]),
    sortOutlines: z.boolean()
});

const screen: ConfigScreen = {
  id: "misc-settings",
  label: "Misc Settings",
  schema,
  form: MiscSettings,
};

export default screen;