import Input from "../../components/Input";
import { Container, Title } from "./layout";

export default function ScanDockerImage() {
  return (
    <>
      <Title>Docker image of a scand-agent</Title>
      <Container>
        <Input label="Docker image" name="scanImage" />
      </Container>
    </>
  );
}
