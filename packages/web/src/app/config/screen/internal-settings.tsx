import * as z from "zod";

import { Checkbox } from "../../../components/Checkbox";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function Internal() {
  return (
    <>
      <Title>Internal settings</Title>
      <Container>
        <Checkbox label="Use development endpoints" name="internalUseDevEndpoints" />
        <Checkbox label="Disable log redaction" name="internalDisableLogRedaction" />
      </Container>
    </>
  );
}

const schema = z.object({
  internalUseDevEndpoints: z.boolean(),
  internalDisableLogRedaction: z.boolean(),
});

const screen: ConfigScreen = {
  id: "internal-settings",
  label: "Internal settings",
  schema,
  form: Internal,
};

export default screen;
