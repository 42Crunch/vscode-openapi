import { BasicCredential } from "@xliic/common/vault";
import CredentialField from "./CredentialField";

export default function BasicCredentialView({ credential }: { credential: BasicCredential }) {
  return (
    <>
      <CredentialField label="Username" value={credential.username} />
      <CredentialField label="Password" value={credential.password} masked />
    </>
  );
}
