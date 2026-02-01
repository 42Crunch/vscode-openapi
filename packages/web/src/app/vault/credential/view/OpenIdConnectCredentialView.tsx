import { AccessTokenCredential } from "@xliic/common/vault";
import CredentialField from "./CredentialField";

export default function OpenIdConnectCredentialView({
  credential,
}: {
  credential: AccessTokenCredential;
}) {
  return (
    <>
      <CredentialField label="Access Token" value={credential.token} masked />
    </>
  );
}
