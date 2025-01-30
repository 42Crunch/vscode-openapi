import * as z from "zod";

import { Checkbox } from "../../../components/Checkbox";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function DevEndpoints() {
  return (
    <>
      <Title>Use development versions of APIs</Title>
      <Container>
        <Checkbox label="Use development endpoints" name="internalUseDevEndpoints" />
      </Container>
    </>
  );
}

const schema = z.object({
  internalUseDevEndpoints: z.boolean(),
});

const screen: ConfigScreen = {
  id: "dev-endpoints",
  label: "Development endpoints",
  schema,
  form: DevEndpoints,
};

export default screen;
