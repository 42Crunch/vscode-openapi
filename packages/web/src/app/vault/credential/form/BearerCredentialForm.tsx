import Input from "../../../../new-components/fat-fields/Input";

export default function BearerCredentialForm() {
  return (
    <>
      <Input label="Token" name="token" />
      <Input label="Format" name="format" />
    </>
  );
}
