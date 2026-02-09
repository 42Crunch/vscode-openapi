import styled from "styled-components";

import { BundledOasSpec, OpenApi30, OpenApi31 } from "@xliic/openapi";

import JsonEditor from "../../../../new-components/fields/JsonEditor";
import { useController } from "react-hook-form";
import PlaintextEditor from "../../../../new-components/fields/PlaintextEditor";

export default function RequestBody({ variables }: { variables: string[] }) {
  // const {
  //   field: { value },
  // } = useController({ name: "body.mediaType" });

  return (
    <Container>
      {<PlaintextEditor name={"body.value"} />}
      {/* {value !== "raw" && <JsonEditor variables={variables} name={"body.value"} />} */}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  gap: 8px;
  display: flex;
  flex-flow: column;
`;
