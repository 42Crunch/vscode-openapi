import { KeyPairCredential } from "@xliic/common/vault";
import CredentialField from "./CredentialField";

export default function MutualTLSCredentialView({
  credential,
}: {
  credential: KeyPairCredential;
}) {
  return (
    <>
      <CredentialField label="Format" value={credential.format} />
      <CredentialField label="PKCS12 Data" value={credential.pkcsData} masked />
      <CredentialField label="PKCS12 Password" value={credential.pkcsPassword} masked />
    </>
  );
}
