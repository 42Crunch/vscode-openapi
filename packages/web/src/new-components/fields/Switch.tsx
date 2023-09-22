import { useController } from "react-hook-form";
import SwitchInput from "../../components/Switch";

export default function Switch({ name }: { name: string }) {
  const { field } = useController({
    name,
  });

  return <SwitchInput value={field.value} onChange={(value) => field.onChange(value)} />;
}
