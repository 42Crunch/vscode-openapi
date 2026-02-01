import Input from "../../../../new-components/fat-fields/Input";

export default function MutualTLSCredentialForm() {
  return (
    <>
      <Input label="PKCS12 Data (base64)" name="pkcsData" />
      <Input label="PKCS12 Password" name="pkcsPassword" />
    </>
  );
}
