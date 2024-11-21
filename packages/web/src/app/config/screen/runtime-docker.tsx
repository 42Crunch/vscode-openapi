import * as z from "zod";

import { Checkbox } from "../../../components/Checkbox";
import Input from "../../../components/Input";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function DockerRuntime() {
  return (
    <>
      <Title>Configuration for Docker runtime</Title>
      <Container>
        <Input label="Docker image for 'scand-agent'" name="scanImage" />

        <Checkbox
          name="docker.replaceLocalhost"
          label='Replace "localhost" hostname with "host.docker.internal" (Windows and Mac only)'
        />
        <Checkbox name="docker.useHostNetwork" label='Use "host" network (Linux only)' />
      </Container>
    </>
  );
}

const schema = z.object({});

const screen: ConfigScreen = {
  id: "runtime-docker",
  label: "Docker",
  schema,
  form: DockerRuntime,
};

export default screen;
