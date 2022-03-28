import { useFormContext, Controller } from "react-hook-form";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";

import { HttpMethods } from "@xliic/common/http";

export default function HttpMethodDropdown({ name }: { name: string }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <DropdownButton
          disabled={true}
          title={value?.toUpperCase()}
          onSelect={(value) => onChange(value)}
          ref={ref}
        >
          {HttpMethods.map((method) => (
            <Dropdown.Item key={method} eventKey={method}>
              {method.toUpperCase()}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      )}
    />
  );
}
