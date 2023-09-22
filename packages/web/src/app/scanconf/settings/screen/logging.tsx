import * as z from "zod";

import Input from "../../../../components/Input";
import Select from "../../../../components/Select";
import { Container, Title } from "../layout";

function Logging() {
  return (
    <>
      <Title>Logging settings</Title>
      <Container>
        <Select
          name="logLevel"
          label="Log level"
          options={[
            { value: "debug", label: "debug" },
            { value: "info", label: "info" },
            { value: "error", label: "error" },
            { value: "critical", label: "critical" },
          ]}
        />
        <Input name="logDestination" label="Log destination" />
      </Container>
    </>
  );
}

const schema = z.object({
  environment: z.string(),
  logLevel: z.string(),
  logDestination: z.string(),
});

const screen: {
  id: string;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
} = {
  id: "logging",
  label: "Logging configuration",
  schema,
  form: Logging,
};

export default screen;
