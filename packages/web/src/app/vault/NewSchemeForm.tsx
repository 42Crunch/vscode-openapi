import { useWatch } from "react-hook-form";

import { SchemeTypeList } from "@xliic/common/vault";

import Input from "../../new-components/fat-fields/Input";
import Select from "../../new-components/fat-fields/Select";

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
