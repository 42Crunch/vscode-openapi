import { useWatch } from "react-hook-form";

import Input from "../../../components/Input";
import Select from "../../../components/Select";

export default function NewCredentialForm() {
  const type = useWatch({ name: "type" });

  return (
    <>
      <Input label="ID" name="id" />
      <Input label="Type (read only)" name="type" disabled={true} />
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
