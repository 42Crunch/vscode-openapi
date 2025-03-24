import styled from "styled-components";

import { BundledOasSpec, OpenApi30, OpenApi31 } from "@xliic/openapi";

import JsonEditor from "../../../../new-components/fields/JsonEditor";
import { useController } from "react-hook-form";
import PlaintextEditor from "../../../../new-components/fields/PlaintextEditor";

export default function RequestBody({
  oas,
  requestBody,
  variables,
}: {
  oas: BundledOasSpec;
  requestBody?: OpenApi31.RequestBody | OpenApi30.RequestBody;
  variables: string[];
}) {
  const {
    field: { value },
  } = useController({ name: "body.mediaType" });

  // FIXME create json body if requestBody is not defined
  if (requestBody === undefined) {
    return null;
  }

  return (
    <Container>
      {value === "raw" && <PlaintextEditor name={"body.value"} />}
      {value !== "raw" && <JsonEditor variables={variables} name={"body.value"} />}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  gap: 8px;
  display: flex;
  flex-flow: column;
`;
