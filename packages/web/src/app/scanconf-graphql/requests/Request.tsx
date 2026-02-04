import { Playbook } from "@xliic/scanconf";

import { useAppSelector } from "../store";
import RequestExternal from "./RequestExternal";
import RequestInternal from "./RequestInternal";

export default function Request({ requestRef }: { requestRef: Playbook.RequestRef }) {
  const { playbook } = useAppSelector((state) => state.scanconf);

  const request =
    requestRef.type === "operation"
      ? playbook.operations[requestRef.id].request
      : playbook.requests?.[requestRef.id];

  if (request === undefined) {
    return <div>Unable to locate the request, failed to resolve: {JSON.stringify(requestRef)}</div>;
  }

  if (request.operationId === undefined) {
    return <RequestExternal requestRef={requestRef} request={request} />;
  } else {
    return <RequestInternal requestRef={requestRef} request={request} />;
  }
}
