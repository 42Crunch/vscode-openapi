import { useAppDispatch, useAppSelector } from "../store/hooks";
import { sendRequest } from "../store/oasSlice";

import Operation from "./operation/Operation";

import { getParameters, wrapFormDefaults, unwrapFormDefaults } from "../util";
import { makeHttpRequest } from "../core/http";

export default function TryOperation() {
  const dispatch = useAppDispatch();
  const { path, method, oas, defaultValues, tryitConfig } = useAppSelector((state) => state.oas);

  const parameters = getParameters(oas, path!, method!);

  const tryOperation = async (data: Record<string, any>) => {
    const values = unwrapFormDefaults(oas, parameters, data);
    const httpRequest = await makeHttpRequest(tryitConfig, oas, method!, path!, values);
    dispatch(sendRequest({ defaultValues: values, request: httpRequest }));
  };

  return (
    <>
      <Operation
        oas={oas}
        config={tryitConfig}
        path={path!}
        method={method!}
        defaultValues={wrapFormDefaults(defaultValues!)}
        onSubmit={tryOperation}
        buttonText="Send"
      />
    </>
  );
}
