import { useWatch } from "react-hook-form";

import Input from "../../../components/Input";
import FileInput from "../../../new-components/fat-fields/FileInput";
import Select from "../../../components/Select";
import { CERTIFICATE_EXTENSIONS } from "./mtls";

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
        <FileInput
          label="Client certificate"
          name="clientCertificate"
          title="Select client certificate"
          extensions={CERTIFICATE_EXTENSIONS}
        />
        <Input label="Client certificate password" name="clientCertificatePassword" password />
        <FileInput
          label="CA server certificate (optional)"
          name="caServerCertificate"
          title="Select CA certificate"
          extensions={CERTIFICATE_EXTENSIONS}
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
