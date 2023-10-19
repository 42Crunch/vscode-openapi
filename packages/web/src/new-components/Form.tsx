import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider, useWatch, FieldValues } from "react-hook-form";
import diff from "microdiff";
import { ZodObject } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Form<T extends FieldValues>({
  data,
  saveData,
  wrapFormData,
  unwrapFormData,
  schema,
  children,
}: {
  data: T;
  saveData: (data: T) => void;
  children: React.ReactNode;
  wrapFormData: (data: T) => FieldValues;
  unwrapFormData: (data: FieldValues) => T;
  schema?: ZodObject<any>;
}) {
  function wrapFormDataVersioned(data: T, version: number) {
    return { ...wrapFormData(data), __version: version };
  }

  function unwrapFormDataVersioned(data: FieldValues) {
    const { __version, ...rest } = data;
    return unwrapFormData(rest);
  }

  const [formValues, setFormValues] = useState(wrapFormDataVersioned(data, 0));

  const methods = useForm({
    values: formValues,
    mode: "all",
    resolver: schema !== undefined ? zodResolver(schema) : undefined,
  });

  const formData = useWatch({ control: methods.control, defaultValue: formValues });

  const timeoutRef = useRef<any>(null);

  const { isValid, isValidating } = methods.formState;

  const version = useRef(0);

  useEffect(() => {
    const difference = diff(unwrapFormDataVersioned(formData), data);
    if (difference.length > 0) {
      // apply every incoming changes, incrementing the current version
      version.current = formValues.__version + 1;
      setFormValues(wrapFormDataVersioned(data, version.current));
    }
  }, [data]);

  useEffect(() => {
    if (isValid && !isValidating) {
      const difference = diff(
        unwrapFormDataVersioned(formData),
        unwrapFormDataVersioned(formValues)
      );
      if (difference.length > 0 && formData.__version === version.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          saveData(unwrapFormDataVersioned(formData));
        }, 250);
      }
    }
  }, [formData, isValid, isValidating]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}
