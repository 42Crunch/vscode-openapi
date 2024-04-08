import { useFormContext } from "react-hook-form";
import { NormalProgressButton } from "../../new-components/ProgressButton";

export default function ValidProgressButton({
  label,
  waiting,
  onClick,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => unknown;
  label: string;
  waiting?: boolean;
}) {
  const {
    formState: { isValid },
  } = useFormContext();

  return (
    <NormalProgressButton disabled={!isValid} label={label} waiting={waiting} onClick={onClick} />
  );
}
