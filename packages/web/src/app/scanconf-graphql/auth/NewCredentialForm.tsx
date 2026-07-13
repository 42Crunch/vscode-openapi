import { useWatch } from "react-hook-form";

import Input from "../../../components/Input";
import FileInput from "../../../new-components/fat-fields/FileInput";
import Select from "../../../components/Select";
import { CA_CERTIFICATE_EXTENSIONS, CERTIFICATE_EXTENSIONS } from "../../scanconf/auth/mtls";

export default function NewCredentialForm({
  allowApiKey,
  allowMtls,
}: {
  allowApiKey: boolean;
  allowMtls: boolean;
}) {
  const type = useWatch({ name: "type" });

  const options = [
    ...(allowApiKey ? [{ value: "apiKey", label: "apiKey" }] : []),
    ...(allowMtls ? [{ value: "mTLS", label: "mTLS" }] : []),
  ];

  const typeSelect = <Select label="Type" name="type" options={options} />;

  if (type === "mTLS") {
    return (
      <>
        {typeSelect}
        <FileInput
          label="Client certificate"
          name="clientCertificate"
          title="Select client certificate"
          extensions={CERTIFICATE_EXTENSIONS}
        />
        <Input label="Certificate password" name="clientCertificatePassword" password />
        <FileInput
          label="Server CA certificate (optional)"
          name="caServerCertificate"
          title="Select CA certificate"
          extensions={CA_CERTIFICATE_EXTENSIONS}
        />
      </>
    );
  }

  return (
    <>
      <Input label="ID" name="id" />
      {typeSelect}
      {type !== "basic" && type !== "bearer" && (
        <>
          <Input label="Location (read only)" name="in" disabled={true} />
          <Input label="Name" name="name" />
        </>
      )}

      <Input label="Description" name="description" />
      <Input label="Credential name (read only, auto-updates from ID)" name="id" disabled={true} />
      <Input label="Credential value (read only)" name="credentialValue" disabled={true} />
    </>
  );
}
