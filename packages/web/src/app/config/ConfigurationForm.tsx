import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodObject } from "zod";

import { Config } from "@xliic/common/config";

import {
  useFeatureDispatch,
  setError,
  clearError,
  saveConfig,
  ConfigScreen,
} from "../../features/config/slice";
import { unwrapFormValues } from "./util";

export default function ConfigurationForm<T extends Partial<Config>>({
  id,
  values,
  schema,
  children,
}: {
  values: T;
  schema: ZodObject<any>;
  children?: React.ReactNode;
  id: ConfigScreen;
}) {
  const dispatch = useFeatureDispatch();

  const methods = useForm({
    values,
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const {
    formState: { isDirty, isValid },
  } = methods;

  function onSubmit(values: T) {
    dispatch(saveConfig(values));
  }

  useEffect(() => {
    methods.trigger();
  }, []);

  useEffect(() => {
    if (isValid && isDirty) {
      methods.handleSubmit(onSubmit)();
    } else {
      onSubmit(unwrapFormValues(methods.getValues()));
    }

    if (isValid) {
      dispatch(clearError(id));
    } else {
      dispatch(
        setError({ screen: id, error: "Validation errors, configuration is not being saved" })
      );
    }
  }, [isDirty, isValid]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}
