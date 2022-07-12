import { OasParameterLocation } from "@xliic/common/oas30";
import { ScanConfig } from "@xliic/common/messages/scan";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateScanConfig } from "../store/oasSlice";

import Operation from "./operation/Operation";
import { HttpMethod } from "@xliic/common/http";

export default function ScanOperation() {
  const dispatch = useAppDispatch();
  const { path, method, oas, scanConfig: config } = useAppSelector((state) => state.oas);

  const scan = (data: Record<string, any>) => {
    const scanConfig = makeScanConfig(method!, path!, data as RequestFormData);
    dispatch(updateScanConfig({ path: path!, method: method!, config: scanConfig }));
  };

  return (
    <>
      <span>noop</span>
    </>
  );
}

interface RequestFormData {
  parameters?: Record<OasParameterLocation, Record<string, any>>;
  host: string;
  requestBody?: string;
}

function makeScanConfig(method: HttpMethod, path: string, data: RequestFormData): ScanConfig {
  return {
    host: data.host,
    requestBody: data.requestBody,
    parameters: {
      header: {},
      query: {},
      cookie: {},
      path: {},
    },
  };
}
