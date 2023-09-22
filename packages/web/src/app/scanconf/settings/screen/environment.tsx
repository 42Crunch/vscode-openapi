import * as z from "zod";

import Input from "../../../../components/Input";
import { Container, Title } from "../layout";

function Environment() {
  return (
    <>
      <Title>Default environment</Title>
      <Container>
        <Input name="environment" label="Default environment" />
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
  id: "environment",
  label: "Environment Settings",
  schema,
  form: Environment,
};

export default screen;
