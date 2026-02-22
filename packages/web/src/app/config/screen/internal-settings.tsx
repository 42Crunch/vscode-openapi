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
        <Checkbox label="Register 42Crunch MCP server" name="internalRegisterMcp" />
        <p>
          Please note: The binary for the mcp server must be manually copied in place and be called{" "}
          <code>42c-ast-mcp</code> or <code>42c-ast-mcp.exe</code>
        </p>
      </Container>
    </>
  );
}

const schema = z.object({
  internalUseDevEndpoints: z.boolean(),
  internalDisableLogRedaction: z.boolean(),
  internalRegisterMcp: z.boolean(),
});

const screen: ConfigScreen = {
  id: "internal-settings",
  label: "Internal settings",
  schema,
  form: Internal,
};

export default screen;
