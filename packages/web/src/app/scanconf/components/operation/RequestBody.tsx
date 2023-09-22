import styled from "styled-components";

import type { BundledOpenApiSpec, OasRequestBody } from "@xliic/common/oas30";

import JsonEditor from "../../../../new-components/fields/JsonEditor";

export default function RequestBody({
  oas,
  requestBody,
  variables,
}: {
  oas: BundledOpenApiSpec;
  requestBody?: OasRequestBody;
  variables: string[];
}) {
  // FIXME create json body if requestBody is not defined
  if (requestBody === undefined) {
    return null;
  }

  return (
    <Container>
      <JsonEditor variables={variables} name={"body.value"} />
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  gap: 8px;
  display: flex;
  flex-flow: column;
`;
