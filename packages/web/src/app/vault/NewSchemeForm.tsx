import { useWatch } from "react-hook-form";

import Input from "../../components/Input";
import Select from "../../components/Select";
import { SchemeTypeList } from "@xliic/common/vault";

export default function NewSchemeForm({ existing }: { existing: string[] }) {
  const type = useWatch({ name: "type" });

  const typeOptions = SchemeTypeList.map((type) => ({ value: type, label: type }));
  const existingOptions = existing.map((name) => ({ value: name, label: name }));

  return (
    <>
      <Input label="Name" name="name" />
      <Select label="Type" name="type" options={typeOptions} />
      {type === "alias" && (
        <>
          <Select label="Alias of" name="scheme" options={existingOptions} />
        </>
      )}
    </>
  );
}
