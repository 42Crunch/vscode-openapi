import { useController } from "react-hook-form";
import PlainSelect, { SelectOption } from "../Select";

export default function Select({ name, options }: { name: string; options: SelectOption[] }) {
  const { field } = useController({
    name,
    rules: { required: true },
  });

  const selected = getOptionByValue(options, field.value);

  const onSelectedItemChange = (value: SelectOption["value"]) => {
    field.onChange(value);
  };

  return (
    <PlainSelect
      options={options}
      selected={selected?.value}
      onSelectedItemChange={onSelectedItemChange}
    />
  );
}

function getOptionByValue(
  options: SelectOption[],
  value: string | number
): SelectOption | undefined {
  return options.filter((option) => option.value === value).pop();
}
