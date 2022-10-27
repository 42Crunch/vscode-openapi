import { useEffect } from "react";
import { useFormContext, useFieldArray, UseFieldArrayAppend, FieldValues } from "react-hook-form";

import Field, { Schema, Parameter } from "./Field";

export default function ArrayField({
  name,
  parameter,
  schema,
  add,
}: {
  name: string;
  parameter: Parameter;
  schema: Schema | undefined;
  add: React.MutableRefObject<Record<string, UseFieldArrayAppend<FieldValues, string>>>;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control,
    name,
  });

  useEffect(() => {
    add.current[name] = append;
    return () => {
      delete add.current[name];
    };
  }, []);

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id}>
          <Field
            name={`${name}.${index}.value`}
            parameter={parameter}
            schema={schema}
            onDelete={() => remove(index)}
          />
        </div>
      ))}
    </>
  );
}
