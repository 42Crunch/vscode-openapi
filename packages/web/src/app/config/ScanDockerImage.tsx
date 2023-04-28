import Input from "../../components/Input";
import { Container, Title } from "./layout";

export default function ScanDockerImage() {
  return (
    <>
      <Title>Scand-agent Docker image</Title>
      <Container>
        <Input label="Docker image" name="scanImage" />
      </Container>
    </>
  );
}
