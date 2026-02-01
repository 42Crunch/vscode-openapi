import { ApiKeyCredential } from "@xliic/common/vault";
import CredentialField from "./CredentialField";

export default function ApiKeyCredentialView({ credential }: { credential: ApiKeyCredential }) {
  return (
    <>
      <CredentialField label="API Key" value={credential.key} masked />
    </>
  );
}
