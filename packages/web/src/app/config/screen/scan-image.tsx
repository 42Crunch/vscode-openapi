import * as z from "zod";
import Input from "../../../components/Input";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function PlatformServices() {
  return (
    <>
      <Title>Scand-agent Docker image</Title>
      <Container>
        <Input label="Docker image" name="scanImage" />
      </Container>
    </>
  );
}

const schema = z.object({}).catchall(z.unknown());

const screen: {
  id: ConfigScreen;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
} = {
  id: "scan-image",
  label: "Docker image",
  schema,
  form: PlatformServices,
};

export default screen;
