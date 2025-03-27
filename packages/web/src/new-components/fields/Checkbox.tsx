import { useController } from "react-hook-form";
import { Checkbox as PlainCheckbox } from "../Checkbox";

export default function Checkbox({
  name,
  size,
  label,
  description,
}: {
  name: string;
  label: string | React.ReactNode;
  size: "medium" | "small";
  description?: string;
}) {
  const { field } = useController({
    name,
  });

  return (
    <PlainCheckbox
      value={field.value}
      onChange={(value) => field.onChange(value)}
      size={size}
      label={label}
      description={description}
    />
  );
}
