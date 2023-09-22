import { useController } from "react-hook-form";

export default function Input({
  name,
  password,
}: {
  name: string;
  disabled?: boolean;
  password?: boolean;
}) {
  const { field } = useController({
    name,
  });

  return <input {...field} type={password ? "password" : "text"} />;
}
