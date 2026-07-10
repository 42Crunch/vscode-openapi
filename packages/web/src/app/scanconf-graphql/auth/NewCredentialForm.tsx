import { useWatch } from "react-hook-form";

import Input from "../../../components/Input";
import Select from "../../../components/Select";

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
        <Input label="Client certificate" name="clientCertificate" />
        <Input label="Client certificate password" name="clientCertificatePassword" password />
        <Input label="CA server certificate (optional)" name="caServerCertificate" />
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
