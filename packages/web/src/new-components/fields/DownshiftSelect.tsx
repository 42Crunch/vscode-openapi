import { useController } from "react-hook-form";
import PlainDownshiftSelect, { SelectOption } from "../DownshiftSelect";

export default function DownshiftSelect<T>({
  name,
  options,
}: {
  name: string;
  options: SelectOption<T>[];
}) {
  const { field } = useController({
    name,
  });

  return (
    <PlainDownshiftSelect
      options={options}
      selected={field.value}
      onSelectedItemChange={(item) => {
        if (item) {
          field.onChange(item.value);
        }
      }}
    />
  );
}
