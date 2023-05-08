import * as z from "zod";
import { Config } from "@xliic/common/config";

import Input from "../../../components/Input";
import { Container, Title } from "../layout";
import { ConfigScreen } from "../../../features/config/slice";

type Section = Pick<Config, "scanImage">;

export function PlatformServices() {
  return (
    <>
      <Title>Scand-agent Docker image</Title>
      <Container>
        <Input<Section> label="Docker image" name="scanImage" />
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
