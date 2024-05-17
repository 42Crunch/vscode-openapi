import * as z from "zod";

import Input from "../../../../new-components/fat-fields/Input";
import Select from "../../../../new-components/fat-fields/Select";

import { Container, Title } from "../layout";
import { schema } from "../schema";

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

        <Input
          name="logDestination"
          label="Log destination"
          description="The destination where Conformance Scan pushes all logs that it produces during a scan. The possible values are 'stdout', 'files', and 'platform'. You can select multiple outputs by adding the character + between the values."
        />
      </Container>
    </>
  );
}

const screen: {
  id: string;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
} = {
  id: "logging",
  label: "Logging settings",
  schema,
  form: Logging,
};

export default screen;
