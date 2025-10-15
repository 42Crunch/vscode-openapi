import * as z from "zod";

import Input from "../../../components/Input";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function ScanProxy() {
  return (
    <>
      <Title>API Scan Proxy</Title>
      <p>The proxy URL for the 42Crunch API Scan.</p>

      <Container>
        <Input label="Proxy URL" name="scanProxy" />
      </Container>
    </>
  );
}

const schema = z.object({
  scanProxy: z.string().url().optional().or(z.literal("")),
});

const screen: ConfigScreen = {
  id: "scan-proxy",
  label: "API Scan proxy",
  schema,
  form: ScanProxy,
};

export default screen;
