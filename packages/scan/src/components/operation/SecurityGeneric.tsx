import { useFormContext, useController } from "react-hook-form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import "react-bootstrap-typeahead/css/Typeahead.bs5.css";

import type { OasSecurityScheme } from "@xliic/common/oas30";

import { useAppSelector } from "../../store/hooks";

export function SecurityGeneric({
  name,
  schema,
  schemaKey,
}: {
  name: string;
  schema: OasSecurityScheme;
  schemaKey: string;
}) {
  const secrets = useAppSelector((state) => state.env.data.secrets);

  const names = Object.keys(secrets).map((name, index) => ({
    id: index,
    label: `{{secrets.${name}}}`,
  }));

  const { control } = useFormContext();

  const { field } = useController({
    name,
    control,
  });

  if (field.value === undefined) {
    return null;
  }

  return (
    <>
      <Typeahead
        id="autocomplete-one"
        className="m-1"
        allowNew
        multiple={false}
        options={names}
        onInputChange={(value) => {
          field.onChange(value);
        }}
        onChange={(selected: any) => {
          if (selected?.[0]?.label) {
            field.onChange(selected[0].label);
          }
        }}
        onBlur={field.onBlur}
        selected={[field.value]}
        ref={field.ref}
      />
    </>
  );
}
