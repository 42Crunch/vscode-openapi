import Input from "../../components/Input";
import { Container, Title } from "./layout";

export default function ScanDockerImage() {
  return (
    <>
      <Title>Docker image of scand-agent to use</Title>
      <Container>
        <Input label="Docker image" name="scanImage" />
      </Container>
    </>
  );
}
