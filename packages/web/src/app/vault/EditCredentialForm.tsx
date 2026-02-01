import { SchemeType } from "@xliic/common/vault";
import Input from "../../new-components/fat-fields/Input";
import Roles from "./Roles";
import BasicCredentialForm from "./credential/form/BasicCredentialForm";
import { ApiKeyCredentialForm } from "./credential/form/ApiKeyCredentialForm";
import BearerCredentialForm from "./credential/form/BearerCredentialForm";
import OAuth2CredentialForm from "./credential/form/OAuth2CredentialForm";
import OpenIdConnectCredentialForm from "./credential/form/OpenIdConnectCredentialForm";
import MutualTLSCredentialForm from "./credential/form/MutualTLSCredentialForm";

export default function EditCredentialForm({ schemeType }: { schemeType: SchemeType }) {
  const credentialFormMap: Record<SchemeType, JSX.Element | undefined> = {
    basic: <BasicCredentialForm />,
    apiKey: <ApiKeyCredentialForm />,
    alias: undefined,
    bearer: <BearerCredentialForm />,
    oauth2: <OAuth2CredentialForm />,
    openIdConnect: <OpenIdConnectCredentialForm />,
    mutualTLS: <MutualTLSCredentialForm />,
  };

  return (
    <>
      <Input label="Name" name="name" />
      {credentialFormMap[schemeType]}
      <Roles label="Roles" name="roles" />
    </>
  );
}
