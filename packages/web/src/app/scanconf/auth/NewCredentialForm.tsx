import { useWatch } from "react-hook-form";

import Input from "../../../components/Input";
import Select from "../../../components/Select";

export default function NewCredentialForm() {
  const type = useWatch({ name: "type" });

  const typeSelect = (
    <Select
      label="Type"
      name="type"
      options={[
        { value: "basic", label: "basic" },
        { value: "bearer", label: "bearer" },
        { value: "apiKey", label: "apiKey" },
        { value: "oauth2", label: "oauth2" },
        { value: "openIdConnect", label: "openIdConnect" },
        { value: "mTLS", label: "mTLS" },
      ]}
    />
  );

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
          <Select
            label="Location"
            name="in"
            options={[
              { value: "header", label: "header" },
              { value: "query", label: "query" },
              { value: "cookie", label: "cookie" },
            ]}
          />
          <Input label="Name" name="name" />
        </>
      )}

      <Input label="Description" name="description" />
      <Input label="Credential name" name="credentialName" />
      <Input label="Credential value" name="credentialValue" />
    </>
  );
}
