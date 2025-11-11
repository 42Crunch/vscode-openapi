import { useWatch } from "react-hook-form";

import { SchemeType, SchemeTypeList, SecurityScheme } from "@xliic/common/vault";

import Input from "../../components/Input";
import Select from "../../components/Select";

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
      {/* <Select label="Type" name="type" options={typeOptions} />
      {type === "alias" && (
        <>
          <Select label="Alias of" name="scheme" options={existingOptions} />
        </>
      )} */}
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
