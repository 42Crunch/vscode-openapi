import { useController } from "react-hook-form";

import PlainRadioGroup, { RadioOption } from "../RadioGroup";

export function RadioGroup({ name, options }: { name: string; options: RadioOption[] }) {
  const { field } = useController({
    name,
  });

  return (
    <PlainRadioGroup
      value={field.value}
      options={options}
      onValueChange={(value: string) => field.onChange(value)}
    />
  );
}
