import { BearerCredential } from "@xliic/common/vault";
import CredentialField from "./CredentialField";

export default function BearerCredentialView({ credential }: { credential: BearerCredential }) {
  return (
    <>
      <CredentialField label="Token" value={credential.token} masked />
      <CredentialField label="Format" value={credential.format} />
    </>
  );
}
