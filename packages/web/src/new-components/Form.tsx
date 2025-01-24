import { useEffect, useRef } from "react";
import { useForm, FormProvider, FieldValues } from "react-hook-form";
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
  useFormMode,
}: {
  data: T;
  saveData: (data: T) => void;
  children: React.ReactNode;
  wrapFormData: (data: T) => FieldValues;
  unwrapFormData: (data: FieldValues) => T;
  schema?: ZodObject<any>;
  useFormMode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valuesRef = useRef(data);
  const methods = useForm({
    defaultValues: wrapFormData(data),
    mode: useFormMode ? useFormMode : "all",
    resolver: schema !== undefined ? zodResolver(schema) : undefined,
  });

  const { formState, handleSubmit, reset } = methods;

  useEffect(() => {
    // update form if the "data" property changes
    const difference = diff(valuesRef.current, data);
    if (difference.length > 0) {
      valuesRef.current = data;
      reset(wrapFormData(data), { keepDirtyValues: true });
    }
  }, [data, valuesRef]);

  useEffect(() => {
    // call "setData" when the form has become dirty and is valid
    const { isDirty, isValid, isValidating, dirtyFields } = formState;

    // cancel pending update if the form value changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // schedule a new one if form is dirty and valid
    if (isDirty && isValid && !isValidating && Object.keys(dirtyFields).length > 0) {
      timeoutRef.current = setTimeout(() => {
        handleSubmit((data) => {
          const updated = unwrapFormData(data);
          valuesRef.current = updated;
          reset(data, { keepValues: true });
          saveData(updated);
        })();
      }, 250);
    }
  }, [formState, valuesRef]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}
