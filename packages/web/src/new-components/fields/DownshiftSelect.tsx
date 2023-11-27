import { useController } from "react-hook-form";
import PlainDownshiftSelect, { SelectOption } from "../DownshiftSelect";

export default function DownshiftSelect<T>({
  name,
  options,
  placeholder,
}: {
  name: string;
  placeholder?: string;
  options: SelectOption<T>[];
}) {
  const { field } = useController({
    name,
  });

  return (
    <PlainDownshiftSelect
      placeholder={placeholder}
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
