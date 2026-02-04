import * as z from "zod";

import Input from "../../../../new-components/fat-fields/Input";
import { Container, Title } from "../layout";
import { schema } from "../schema";

function Environment() {
  return (
    <>
      <Title>Default environment</Title>
      <Container>
        <Input name="environment" label="Default environment" disabled />
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
  id: "environment",
  label: "Environment settings",
  schema,
  form: Environment,
};

export default screen;
