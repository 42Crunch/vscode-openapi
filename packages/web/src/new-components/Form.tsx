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
  const [formValues, setFormValues] = useState(wrapFormData(data));
  const methods = useForm({
    values: formValues,
    mode: "all",
    resolver: schema !== undefined ? zodResolver(schema) : undefined,
  });
  const formData = useWatch({ control: methods.control, defaultValue: formValues });
  const timeoutRef = useRef<any>(null);
  const { isValid, isValidating } = methods.formState;

  useEffect(() => {
    // save form values when 'formData' has changed (as compared to 'data' prop) and form is valid
    // we can see changes before validation has been performed, so delay saving data
    // so we can cancel update if the form turns out to be invalid
    const difference = diff(data, unwrapFormData(formData));
    if (difference.length > 0) {
      // clear timeout, prepare to schedule a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // only save if form is valid and is not being validated ATM
      if (isValid && !isValidating) {
        timeoutRef.current = setTimeout(() => {
          saveData(unwrapFormData(formData));
        }, 250);
      }
    }
    // not returning cleanup function, it's okay for the last timer to trigger
    // even if the component has been unmounted
  }, [formData, isValid, isValidating]);

  useEffect(() => {
    // update form values only when 'data' prop changes
    const difference = diff(data, unwrapFormData(formData));
    if (difference.length > 0) {
      setFormValues(wrapFormData(data));
    }
  }, [data]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}
