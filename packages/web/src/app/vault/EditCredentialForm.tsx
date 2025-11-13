import { SchemeType } from "@xliic/common/vault";
import Input from "../../new-components/fat-fields/Input";

export default function EditCredentialForm({ schemeType }: { schemeType: SchemeType }) {
  const credentialFormMap: Record<SchemeType, JSX.Element | undefined> = {
    basic: <BasicCredentialForm />,
    apiKey: <ApiKeyCredentialForm />,
    alias: undefined,
    bearer: undefined,
    oauth2: undefined,
    openIdConnect: undefined,
    mutualTLS: undefined,
  };

  return (
    <>
      <Input label="Name" name="name" />
      {credentialFormMap[schemeType]}
    </>
  );
}

function BasicCredentialForm() {
  return (
    <>
      <Input label="Username" name="username" />
      <Input label="Password" name="password" />
    </>
  );
}

function ApiKeyCredentialForm() {
  return (
    <>
      <Input label="Api Key" name="key" />
    </>
  );
}
