import styled from "styled-components";

import { HttpMethod } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";

import OperationTabs from "./OperationTabs";

export default function Operation({
  oas,
  credentials,
  settings,
  path,
  method,
  variables,
}: {
  oas: BundledSwaggerOrOasSpec;
  credentials: playbook.Credentials;
  settings?: JSX.Element;
  path: string;
  method: HttpMethod;
  variables: string[];
}) {
  return (
    <Container>
      <OperationTabs
        oas={oas}
        credentials={credentials}
        settings={settings}
        path={path}
        method={method}
        variables={variables}
      />
    </Container>
  );
}

const Container = styled.div``;
