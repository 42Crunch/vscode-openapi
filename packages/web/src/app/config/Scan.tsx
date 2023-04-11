import Input from "../../components/Input";
import Button from "../../components/Button";

export default function PlatformConnection() {
  return (
    <>
      <h4 style={{ marginTop: 0 }}>Scan parameters</h4>
      <Input label="Platform URL" name="platformUrl" />
      <Input label="IDE token" name="platformApiToken" />
      <Button>Test connection</Button>
    </>
  );
}
