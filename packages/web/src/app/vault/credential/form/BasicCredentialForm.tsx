import Input from "../../../../new-components/fat-fields/Input";

export default function BasicCredentialForm() {
  return (
    <>
      <Input label="Username" name="username" />
      <Input label="Password" name="password" />
    </>
  );
}
